import { polar } from "@/lib/polar/index";
import { logger } from "@/lib/logger";
import { UnauthorizedError } from "@/lib/errors";
import { locales } from "@/locales";
import type { CreditBalance, UsageEvent } from "../models/credits.model";

export async function getCreditsBalance(
  userId: string,
  meterId: string
): Promise<CreditBalance | null> {
  return polar.getCreditBalance(userId, meterId);
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

  if (!creditBalance) {
    return false;
  }

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
    if (error instanceof UnauthorizedError) {
      throw error;
    }

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
 * Fire-and-forget: gateway swallows errors so the action result isn't
 * undone by a downstream metering failure.
 *
 * @param userId - The app user ID (used as externalCustomerId in Polar)
 * @param events - Single event or array of events to ingest
 */
export async function ingestUsage(
  userId: string,
  events: UsageEvent | UsageEvent[]
): Promise<void> {
  await polar.recordUsage(userId, events);
}
