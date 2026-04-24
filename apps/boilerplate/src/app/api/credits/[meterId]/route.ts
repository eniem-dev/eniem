import { NextRequest } from "next/server";
import { authed } from "@/lib/handler";
import { getCreditsBalance, getCustomerId } from "@/features/credits";
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

  return authed.route(async ({ user }): Promise<CreditsData> => {
    const customerId = await getCustomerId(user.id);
    const hasCustomer = customerId !== null;
    const balance = await getCreditsBalance(user.id, meterId);

    return { balance, hasCustomer };
  })(request);
}
