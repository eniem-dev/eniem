import { NextRequest } from "next/server";
import { createAuthenticatedApiHandler } from "@/lib/server-handler";
import { getUsageHistory } from "@/features/credits/services/credits-usage.service";
import type { UsageHistoryResult } from "@/features/credits/models/credits.model";

export async function GET(request: NextRequest) {
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");

  const handler = await createAuthenticatedApiHandler<UsageHistoryResult>(
    async ({ user }) => {
      return getUsageHistory(user.id, { limit, page });
    }
  );

  return handler(request);
}
