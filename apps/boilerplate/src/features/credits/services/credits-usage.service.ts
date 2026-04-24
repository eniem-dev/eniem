import { polar } from "@/lib/polar/index";
import { logger } from "@/lib/logger";
import { env } from "@/config";
import { resolveEventDisplayName } from "../meters.generated";
import type { UsageHistoryResult } from "../models/credits.model";

export async function getUsageHistory(
  userId: string,
  options?: { limit?: number; page?: number }
): Promise<UsageHistoryResult> {
  try {
    const result = await polar.listUsageHistory(userId, options);
    const polarEnv = env.payment.polarServer;
    return {
      ...result,
      events: result.events.map((event) => ({
        ...event,
        name: resolveEventDisplayName(polarEnv, event.name),
      })),
    };
  } catch (error) {
    logger.error("Failed to fetch usage history", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
