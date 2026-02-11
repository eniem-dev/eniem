import { polarClient } from "@/lib/polar";
import { logger } from "@/lib/logger";
import { UnauthorizedError } from "@/lib/errors";
import { locales } from "@/locales";
import { getCustomerId } from "@/features/billing/services/billing.service";
import type { CreditBalance, UsageEvent } from "../models/credits.model";

// Re-export for backwards compatibility
export { getCustomerId };

export async function getCreditsBalance(
  userId: string,
  meterId: string
): Promise<CreditBalance | null> {
  const customerId = await getCustomerId(userId);
  if (!customerId) {
    return null;
  }

  try {
    const customerState = await polarClient.customers.getStateExternal({
      externalId: userId,
    });

    const meter = customerState.activeMeters?.find((m) => m.meterId === meterId);
    if (!meter) {
      logger.warn("Meter not found for customer", { customerId, meterId });
      return { meterId, balance: 0, customerId };
    }

    return {
      meterId,
      balance: meter.balance,
      customerId,
    };
  } catch (error) {
    logger.error("Failed to fetch credit balance", { userId, meterId, error });
    throw error;
  }
}

/**
 * Check if user has sufficient credits for an action.
 *
 * @param userId - The app user ID
 * @param meterId - The Polar meter identifier
 * @param requiredAmount - The number of credits required
 * @returns true if user has >= requiredAmount credits, false otherwise
 */
export async function hasCredits(
  userId: string,
  meterId: string,
  requiredAmount: number
): Promise<boolean> {
  const creditBalance = await getCreditsBalance(userId, meterId);

  // No customer/subscription = no credits
  if (!creditBalance) {
    return false;
  }

  // Treat negative balance as 0 (Polar allows negative, we don't)
  const effectiveBalance = Math.max(0, creditBalance.balance);

  return effectiveBalance >= requiredAmount;
}

/**
 * Server-side guard that throws if user lacks sufficient credits.
 *
 * Use this in server actions before credit-consuming operations.
 * Implements fail-safe: throws on API errors (doesn't allow action to proceed).
 *
 * @param userId - The app user ID
 * @param meterId - The Polar meter identifier
 * @param requiredAmount - The number of credits required
 * @throws UnauthorizedError if credits insufficient or API unavailable
 */
export async function assertHasCredits(
  userId: string,
  meterId: string,
  requiredAmount: number
): Promise<void> {
  try {
    const hasSufficientCredits = await hasCredits(userId, meterId, requiredAmount);

    if (!hasSufficientCredits) {
      logger.warn("Insufficient credits", { userId, meterId, requiredAmount });
      throw new UnauthorizedError(locales.errors.insufficientCredits);
    }
  } catch (error) {
    // Re-throw UnauthorizedError as-is
    if (error instanceof UnauthorizedError) {
      throw error;
    }

    // API failure - fail-safe by blocking the action
    logger.error("Credits check failed", {
      userId,
      meterId,
      requiredAmount,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new UnauthorizedError(locales.errors.creditsCheckFailed);
  }
}

/**
 * Ingest usage events to Polar to decrement the user's credit meter.
 *
 * Call this after an action completes successfully. Events are immutable
 * once ingested and cannot be changed or deleted.
 *
 * @param userId - The app user ID (used as externalCustomerId in Polar)
 * @param events - Single event or array of events to ingest
 * @returns void - errors are logged but not thrown (action already completed)
 */
export async function ingestUsage(
  userId: string,
  events: UsageEvent | UsageEvent[]
): Promise<void> {
  const eventArray = Array.isArray(events) ? events : [events];

  if (eventArray.length === 0) {
    return;
  }

  try {
    await polarClient.events.ingest({
      events: eventArray.map((event) => ({
        name: event.name,
        externalCustomerId: userId,
        metadata: event.metadata,
        timestamp: event.timestamp,
      })),
    });

    logger.info("Usage events ingested", {
      userId,
      eventCount: eventArray.length,
      eventNames: eventArray.map((e) => e.name),
    });
  } catch (error) {
    // Log error but don't throw - the action already completed
    // Consider implementing a retry queue for production
    logger.error("Failed to ingest usage events", {
      userId,
      eventCount: eventArray.length,
      eventNames: eventArray.map((e) => e.name),
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
