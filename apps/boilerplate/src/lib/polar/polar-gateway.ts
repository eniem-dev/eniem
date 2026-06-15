import type { Polar } from "@polar-sh/sdk";
import type { CustomerState } from "@polar-sh/sdk/models/components/customerstate.js";
import { ResourceNotFound } from "@polar-sh/sdk/models/errors/resourcenotfound.js";
import { logger } from "@/lib/logger";
import {
  mapDownloadable,
  mapGitHubBenefits,
  mapOrderToBillingOrder,
  mapSubscriptionToDomain,
} from "./polar-mappers";
import type {
  BillingOrder,
  CreditBalance,
  Downloadable,
  GitHubBenefit,
  PolarSubscription,
  UsageEvent,
  UsageHistoryResult,
  UsageMetadata,
} from "./polar-domain";

export type { CustomerState };

export interface PolarGateway {
  listUserOrders(userId: string): Promise<BillingOrder[]>;
  getCreditBalance(userId: string, meterId: string): Promise<CreditBalance | null>;
  recordUsage(userId: string, events: UsageEvent | UsageEvent[]): Promise<void>;
  listUsageHistory(
    userId: string,
    opts?: { limit?: number; page?: number }
  ): Promise<UsageHistoryResult>;
  getUserCustomerState(userId: string): Promise<CustomerState | null>;
  fetchActiveSubscriptions(userId: string): Promise<PolarSubscription[]>;
  hasAnyBenefitGrant(userId: string): Promise<boolean>;
  listDownloadables(userId: string): Promise<Downloadable[]>;
  listGitHubBenefits(userId: string): Promise<GitHubBenefit[]>;
  deleteUserCustomer(userId: string): Promise<void>;
}

const READ_TIMEOUT_MS = 5_000;
const WRITE_TIMEOUT_MS = 10_000;
const READ_MAX_ATTEMPTS = 2;

function readNumber(obj: object, key: string): number | undefined {
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === "number" ? v : undefined;
}

function readString(obj: object, key: string): string | undefined {
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === "string" ? v : undefined;
}

function isRetryable(error: unknown): boolean {
  if (error instanceof ResourceNotFound) return false;
  if (!(error instanceof Error)) return false;
  const status = readNumber(error, "status") ?? readNumber(error, "statusCode");
  if (typeof status === "number" && status >= 500 && status < 600) return true;
  if (error.name === "AbortError" || error.name === "TimeoutError") return true;
  const code = readString(error, "code");
  if (code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ENOTFOUND") return true;
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isUsageMetadata(value: unknown): value is UsageMetadata {
  if (typeof value !== "object" || value === null) return false;
  for (const v of Object.values(value)) {
    const t = typeof v;
    if (t !== "string" && t !== "number" && t !== "boolean") return false;
  }
  return true;
}

function toUsageMetadata(value: unknown): UsageMetadata {
  return isUsageMetadata(value) ? value : {};
}

async function safeRead<T>(
  op: string,
  userId: string,
  fn: (signal: AbortSignal) => Promise<T>
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= READ_MAX_ATTEMPTS; attempt++) {
    const start = Date.now();
    try {
      return await fn(AbortSignal.timeout(READ_TIMEOUT_MS));
    } catch (error) {
      lastError = error;
      if (error instanceof ResourceNotFound) {
        logger.debug(`Polar ${op} not found`, { op, userId });
        throw error;
      }
      if (attempt < READ_MAX_ATTEMPTS && isRetryable(error)) {
        const backoffMs = 50 * Math.pow(2, attempt - 1);
        logger.warn("Polar read retrying", {
          op,
          userId,
          attempt,
          durationMs: Date.now() - start,
          error: errorMessage(error),
        });
        await sleep(backoffMs);
        continue;
      }
      logger.error(`Polar ${op} failed`, { op, userId, error: errorMessage(error) });
      throw error;
    }
  }
  throw lastError;
}

async function safeWrite<T>(
  op: string,
  userId: string,
  fn: (signal: AbortSignal) => Promise<T>
): Promise<T> {
  try {
    return await fn(AbortSignal.timeout(WRITE_TIMEOUT_MS));
  } catch (error) {
    if (error instanceof ResourceNotFound) {
      logger.debug(`Polar ${op} not found`, { op, userId });
      throw error;
    }
    logger.error(`Polar ${op} failed`, { op, userId, error: errorMessage(error) });
    throw error;
  }
}

async function notFoundOr<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ResourceNotFound) return fallback;
    throw error;
  }
}

export function createPolarGateway(client: Polar): PolarGateway {
  function resolveCustomerId(userId: string): Promise<string | null> {
    return notFoundOr(
      safeRead("resolveCustomerId", userId, (signal) =>
        client.customers.getExternal({ externalId: userId }, { signal })
      ).then((c) => c.id),
      null
    );
  }

  function getUserCustomerState(userId: string): Promise<CustomerState | null> {
    return notFoundOr<CustomerState | null>(
      safeRead("getUserCustomerState", userId, (signal) =>
        client.customers.getStateExternal({ externalId: userId }, { signal })
      ),
      null
    );
  }

  async function listUserOrders(userId: string): Promise<BillingOrder[]> {
    const customerId = await resolveCustomerId(userId);
    if (!customerId) return [];
    const response = await notFoundOr(
      safeRead("listUserOrders", userId, (signal) =>
        client.orders.list({ customerId, limit: 20 }, { signal })
      ),
      null
    );
    if (!response) return [];
    return (response.result.items ?? []).map(mapOrderToBillingOrder);
  }

  async function getCreditBalance(
    userId: string,
    meterId: string
  ): Promise<CreditBalance | null> {
    const state = await getUserCustomerState(userId);
    if (!state) return null;
    const meter = state.activeMeters?.find((m) => m.meterId === meterId);
    return { meterId, balance: meter?.balance ?? 0, customerId: state.id };
  }

  async function recordUsage(
    userId: string,
    events: UsageEvent | UsageEvent[]
  ): Promise<void> {
    const eventArray = Array.isArray(events) ? events : [events];
    if (eventArray.length === 0) return;
    try {
      await safeWrite("recordUsage", userId, (signal) =>
        client.events.ingest(
          {
            events: eventArray.map((event) => ({
              name: event.name,
              externalCustomerId: userId,
              metadata: event.metadata,
              timestamp: event.timestamp,
            })),
          },
          { signal }
        )
      );
    } catch {
      // fire-and-forget: errors already logged by safeWrite
    }
  }

  async function listUsageHistory(
    userId: string,
    opts?: { limit?: number; page?: number }
  ): Promise<UsageHistoryResult> {
    const limit = opts?.limit ?? 20;
    const page = opts?.page ?? 1;
    const empty: UsageHistoryResult = {
      events: [],
      pagination: { totalCount: 0, maxPage: 1, currentPage: page },
    };
    const customerId = await resolveCustomerId(userId);
    if (!customerId) return empty;

    const response = await notFoundOr(
      safeRead("listUsageHistory", userId, (signal) =>
        client.events.list({ customerId, limit, page, source: "user" }, { signal })
      ),
      null
    );
    if (!response) return empty;
    return {
      events: response.result.items.map((item) => ({
        id: item.id,
        name: item.name,
        timestamp: item.timestamp,
        metadata: toUsageMetadata(item.metadata),
      })),
      pagination: {
        totalCount: response.result.pagination.totalCount,
        maxPage: response.result.pagination.maxPage,
        currentPage: page,
      },
    };
  }

  async function fetchActiveSubscriptions(userId: string): Promise<PolarSubscription[]> {
    const state = await getUserCustomerState(userId);
    if (!state) return [];
    return (state.activeSubscriptions ?? []).map(mapSubscriptionToDomain);
  }

  async function openPortal(userId: string): Promise<string> {
    const session = await safeWrite("createCustomerSession", userId, (signal) =>
      client.customerSessions.create({ externalCustomerId: userId }, { signal })
    );
    return session.token;
  }

  async function hasAnyBenefitGrant(userId: string): Promise<boolean> {
    return notFoundOr(
      (async () => {
        const token = await openPortal(userId);
        const response = await safeRead("listBenefitGrants", userId, (signal) =>
          client.customerPortal.benefitGrants.list(
            { customerSession: token },
            {},
            { signal }
          )
        );
        return (response.result.items?.length ?? 0) > 0;
      })(),
      false
    );
  }

  async function listDownloadables(userId: string): Promise<Downloadable[]> {
    return notFoundOr<Downloadable[]>(
      (async () => {
        const token = await openPortal(userId);
        const response = await safeRead("listDownloadables", userId, (signal) =>
          client.customerPortal.downloadables.list(
            { customerSession: token },
            {},
            { signal }
          )
        );
        return (response.result.items ?? []).map(mapDownloadable);
      })(),
      []
    );
  }

  async function listGitHubBenefits(userId: string): Promise<GitHubBenefit[]> {
    return notFoundOr<GitHubBenefit[]>(
      (async () => {
        const token = await openPortal(userId);
        const response = await safeRead("listGitHubBenefits", userId, (signal) =>
          client.customerPortal.benefitGrants.list(
            { customerSession: token },
            {},
            { signal }
          )
        );
        return mapGitHubBenefits(response.result.items ?? []);
      })(),
      []
    );
  }

  async function deleteUserCustomer(userId: string): Promise<void> {
    await notFoundOr(
      safeWrite("deleteUserCustomer", userId, (signal) =>
        client.customers.deleteExternal({ externalId: userId }, { signal })
      ),
      undefined
    );
  }

  return {
    listUserOrders,
    getCreditBalance,
    recordUsage,
    listUsageHistory,
    getUserCustomerState,
    fetchActiveSubscriptions,
    hasAnyBenefitGrant,
    listDownloadables,
    listGitHubBenefits,
    deleteUserCustomer,
  };
}
