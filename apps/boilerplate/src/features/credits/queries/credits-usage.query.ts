import { authed } from "@/lib/handler";
import { getUsageHistory } from "../services/credits-usage.service";
import type { UsageHistoryResult } from "../models/credits.model";

export const getCreditsUsageQuery = () =>
  authed.query(async ({ user }): Promise<UsageHistoryResult> => {
    return getUsageHistory(user.id, { limit: 20 });
  });
