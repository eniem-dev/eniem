import { authed } from "@/lib/handler";
import { polar } from "@/lib/polar/index";
import { getCreditsBalance } from "@/features/billing";
import type { CreditBalance } from "@/features/billing";

export interface CreditsData {
  balance: CreditBalance | null;
  hasCustomer: boolean;
}

export const GET = authed.route(
  async ({ user, context }): Promise<CreditsData> => {
    const { meterId } = (await context.params) as { meterId: string };
    const customerState = await polar.getUserCustomerState(user.id);
    const hasCustomer = customerState !== null;
    const balance = await getCreditsBalance(user.id, meterId);

    return { balance, hasCustomer };
  }
);
