import { NextRequest } from "next/server";
import { createAuthenticatedApiHandler } from "@/lib/server-handler";
import { getCreditsBalance, getCustomerId } from "@/features/credits/services/credits.service";
import type { CreditBalance } from "@/features/credits/models/credits.model";

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
      const customerId = await getCustomerId(user.id);
      const hasCustomer = customerId !== null;
      const balance = await getCreditsBalance(user.id, meterId);

      return { balance, hasCustomer };
    }
  );

  return handler(request);
}
