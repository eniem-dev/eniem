import { NextRequest } from "next/server";
import { createAuthenticatedApiHandler } from "@/lib/server-handler";
import { getCreditsBalance } from "@/features/credits";
import type { CreditBalance } from "@/features/credits";

export interface CreditsData {
  balance: CreditBalance | null;
  hasCustomer: boolean;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ meterId: string }> }
) {
  const { meterId } = await context.params;

  const handler = await createAuthenticatedApiHandler<CreditsData>(
    async ({ user }) => {
      const balance = await getCreditsBalance(user.id, meterId);
      const hasCustomer = balance !== null;

      return { balance, hasCustomer };
    }
  );

  return handler(request);
}
