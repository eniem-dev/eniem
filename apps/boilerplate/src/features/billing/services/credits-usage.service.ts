import { polar } from "@/lib/polar/index";
import { env } from "@/config";
import { resolveEventDisplayName } from "../generated/meters.generated";
import type { UsageHistoryResult } from "../models/credits.model";

export async function getUsageHistory(
  userId: string,
  options?: { limit?: number; page?: number }
): Promise<UsageHistoryResult> {
  const result = await polar.listUsageHistory(userId, options);
  const polarEnv = env.payment.polarServer;
  return {
    ...result,
    events: result.events.map((event) => ({
      ...event,
      name: resolveEventDisplayName(polarEnv, event.name),
    })),
  };
}
