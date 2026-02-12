import { createAuthenticatedQuery } from "@/lib/server-handler";
import { getUsageHistory } from "../services/credits-usage.service";
import type { UsageHistoryResult } from "../models/credits.model";

export const getCreditsUsageQuery = () =>
  createAuthenticatedQuery(async ({ user }): Promise<UsageHistoryResult> => {
    return getUsageHistory(user.id, { limit: 20 });
  });
