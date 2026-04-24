import type { Polar } from "@polar-sh/sdk";
import type { CustomerState } from "@polar-sh/sdk/models/components/customerstate.js";
import { ResourceNotFound } from "@polar-sh/sdk/models/errors/resourcenotfound.js";
import { cache } from "react";
import { logger } from "@/lib/logger";
// The gateway's contract is feature-owned domain models — types flow up by design.
/* eslint-disable no-restricted-imports */
import type { BillingOrder } from "@/features/billing/models/billing.model";
import type { Downloadable } from "@/features/benefits/models/downloadable.model";
import type { GitHubBenefit } from "@/features/benefits/models/github-benefit.model";
import type {
  CreditBalance,
  UsageEvent,
  UsageHistoryResult,
} from "@/features/credits/models/credits.model";
import type { PolarSubscription } from "@/features/subscription/models/subscription.model";
/* eslint-enable no-restricted-imports */
import {
  mapDownloadable,
  mapGitHubBenefits,
  mapOrderToBillingOrder,
  mapSubscriptionToDomain,
} from "./polar-mappers";

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

interface RetryableError {
  status?: number;
  statusCode?: number;
  code?: string;
  name?: string;
}

function isRetryable(error: unknown): boolean {
  if (error instanceof ResourceNotFound) return false;
  if (!(error instanceof Error)) return false;
  const e = error as Error & RetryableError;
  const status = e.status ?? e.statusCode;
  if (typeof status === "number" && status >= 500 && status < 600) return true;
  if (e.name === "AbortError" || e.name === "TimeoutError") return true;
  if (e.code === "ECONNRESET" || e.code === "ETIMEDOUT" || e.code === "ENOTFOUND") return true;
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function executeRead<T>(op: string, fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= READ_MAX_ATTEMPTS; attempt++) {
    const start = Date.now();
    try {
      return await fn(AbortSignal.timeout(READ_TIMEOUT_MS));
    } catch (error) {
      lastError = error;
      if (error instanceof ResourceNotFound) throw error;
      if (attempt < READ_MAX_ATTEMPTS && isRetryable(error)) {
        const backoffMs = 50 * Math.pow(2, attempt - 1);
        logger.warn("Polar read retrying", {
          op,
          attempt,
          durationMs: Date.now() - start,
          error: error instanceof Error ? error.message : String(error),
        });
        await sleep(backoffMs);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

async function executeWrite<T>(_op: string, fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  return fn(AbortSignal.timeout(WRITE_TIMEOUT_MS));
}

export function createPolarGateway(client: Polar): PolarGateway {
  const resolveCustomerId = cache(async (userId: string): Promise<string | null> => {
    try {
      const customer = await executeRead("resolveCustomerId", (signal) =>
        client.customers.getExternal({ externalId: userId }, { signal })
      );
      return customer.id;
    } catch (error) {
      if (error instanceof ResourceNotFound) {
        logger.debug("Polar customer not found", { op: "resolveCustomerId", userId });
        return null;
      }
      logger.error("Polar customer resolution failed", {
        op: "resolveCustomerId",
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });

  async function getUserCustomerState(userId: string): Promise<CustomerState | null> {
    try {
      return await executeRead("getUserCustomerState", (signal) =>
        client.customers.getStateExternal(
          { externalId: userId },
          { signal }
        )
      );
    } catch (error) {
      if (error instanceof ResourceNotFound) {
        logger.debug("Polar customer state not found", {
          op: "getUserCustomerState",
          userId,
        });
        return null;
      }
      logger.error("Polar getUserCustomerState failed", {
        op: "getUserCustomerState",
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async function listUserOrders(userId: string): Promise<BillingOrder[]> {
    const customerId = await resolveCustomerId(userId);
    if (!customerId) return [];
    try {
      const response = await executeRead("listUserOrders", (signal) =>
        client.orders.list({ customerId, limit: 20 }, { signal })
      );
      const items = response.result.items ?? [];
      return items.map(mapOrderToBillingOrder);
    } catch (error) {
      if (error instanceof ResourceNotFound) {
        logger.debug("Polar orders not found", { op: "listUserOrders", userId });
        return [];
      }
      logger.error("Polar listUserOrders failed", {
        op: "listUserOrders",
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async function getCreditBalance(
    userId: string,
    meterId: string
  ): Promise<CreditBalance | null> {
    const state = await getUserCustomerState(userId);
    if (!state) return null;
    const meter = state.activeMeters?.find((m) => m.meterId === meterId);
    if (!meter) {
      return { meterId, balance: 0, customerId: state.id };
    }
    return { meterId, balance: meter.balance, customerId: state.id };
  }

  async function recordUsage(
    userId: string,
    events: UsageEvent | UsageEvent[]
  ): Promise<void> {
    const eventArray = Array.isArray(events) ? events : [events];
    if (eventArray.length === 0) return;
    try {
      await executeWrite("recordUsage", (signal) =>
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
    } catch (error) {
      logger.error("Polar recordUsage failed", {
        op: "recordUsage",
        userId,
        eventCount: eventArray.length,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function listUsageHistory(
    userId: string,
    opts?: { limit?: number; page?: number }
  ): Promise<UsageHistoryResult> {
    const limit = opts?.limit ?? 20;
    const page = opts?.page ?? 1;
    const customerId = await resolveCustomerId(userId);
    if (!customerId) {
      return {
        events: [],
        pagination: { totalCount: 0, maxPage: 1, currentPage: page },
      };
    }
    try {
      const response = await executeRead("listUsageHistory", (signal) =>
        client.events.list(
          { customerId, limit, page, source: "user" },
          { signal }
        )
      );
      return {
        events: response.result.items.map((item) => ({
          id: item.id,
          name: item.name,
          timestamp: item.timestamp,
          metadata: item.metadata as Record<string, string | number | boolean>,
        })),
        pagination: {
          totalCount: response.result.pagination.totalCount,
          maxPage: response.result.pagination.maxPage,
          currentPage: page,
        },
      };
    } catch (error) {
      if (error instanceof ResourceNotFound) {
        logger.debug("Polar usage history not found", {
          op: "listUsageHistory",
          userId,
        });
        return {
          events: [],
          pagination: { totalCount: 0, maxPage: 1, currentPage: page },
        };
      }
      logger.error("Polar listUsageHistory failed", {
        op: "listUsageHistory",
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async function fetchActiveSubscriptions(userId: string): Promise<PolarSubscription[]> {
    const state = await getUserCustomerState(userId);
    if (!state) return [];
    return (state.activeSubscriptions ?? []).map(mapSubscriptionToDomain);
  }

  async function hasAnyBenefitGrant(userId: string): Promise<boolean> {
    try {
      const customerSession = await executeWrite("createCustomerSession", (signal) =>
        client.customerSessions.create(
          { externalCustomerId: userId },
          { signal }
        )
      );
      const response = await executeRead("listBenefitGrants", (signal) =>
        client.customerPortal.benefitGrants.list(
          { customerSession: customerSession.token },
          {},
          { signal }
        )
      );
      return (response.result.items?.length ?? 0) > 0;
    } catch (error) {
      if (error instanceof ResourceNotFound) {
        logger.debug("Polar benefit grants not found", {
          op: "hasAnyBenefitGrant",
          userId,
        });
        return false;
      }
      logger.error("Polar hasAnyBenefitGrant failed", {
        op: "hasAnyBenefitGrant",
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async function listDownloadables(userId: string): Promise<Downloadable[]> {
    try {
      const customerSession = await executeWrite("createCustomerSession", (signal) =>
        client.customerSessions.create(
          { externalCustomerId: userId },
          { signal }
        )
      );
      const response = await executeRead("listDownloadables", (signal) =>
        client.customerPortal.downloadables.list(
          { customerSession: customerSession.token },
          {},
          { signal }
        )
      );
      const items = response.result.items ?? [];
      return items.map(mapDownloadable);
    } catch (error) {
      if (error instanceof ResourceNotFound) {
        logger.debug("Polar downloadables not found", {
          op: "listDownloadables",
          userId,
        });
        return [];
      }
      logger.error("Polar listDownloadables failed", {
        op: "listDownloadables",
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async function listGitHubBenefits(userId: string): Promise<GitHubBenefit[]> {
    try {
      const customerSession = await executeWrite("createCustomerSession", (signal) =>
        client.customerSessions.create(
          { externalCustomerId: userId },
          { signal }
        )
      );
      const response = await executeRead("listGitHubBenefits", (signal) =>
        client.customerPortal.benefitGrants.list(
          { customerSession: customerSession.token },
          {},
          { signal }
        )
      );
      const items = response.result.items ?? [];
      return mapGitHubBenefits(items);
    } catch (error) {
      if (error instanceof ResourceNotFound) {
        logger.debug("Polar github benefits not found", {
          op: "listGitHubBenefits",
          userId,
        });
        return [];
      }
      logger.error("Polar listGitHubBenefits failed", {
        op: "listGitHubBenefits",
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async function deleteUserCustomer(userId: string): Promise<void> {
    try {
      await executeWrite("deleteUserCustomer", (signal) =>
        client.customers.deleteExternal(
          { externalId: userId },
          { signal }
        )
      );
    } catch (error) {
      if (error instanceof ResourceNotFound) {
        logger.debug("Polar customer to delete not found", {
          op: "deleteUserCustomer",
          userId,
        });
        return;
      }
      logger.error("Polar deleteUserCustomer failed", {
        op: "deleteUserCustomer",
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
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
