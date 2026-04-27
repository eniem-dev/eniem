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

export async function ingestUsage(
  userId: string,
  events: UsageEvent | UsageEvent[]
): Promise<void> {
  await polar.recordUsage(userId, events);
}
