import { authed } from "@/lib/handler";

import { getUsageHistory } from "@/features/billing";
import type { UsageHistoryResult } from "@/features/billing";

export const GET = authed.route(
  async ({ user, request }): Promise<UsageHistoryResult> => {
    const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
    return getUsageHistory(user.id, { limit, page });
  }
);
