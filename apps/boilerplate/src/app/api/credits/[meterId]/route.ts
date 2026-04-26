import { authed } from "@/lib/handler";
import { getCreditsBalance } from "@/features/billing";
import { getCustomerId } from "@/features/billing";
import type { CreditBalance } from "@/features/billing";

export interface CreditsData {
  balance: CreditBalance | null;
  hasCustomer: boolean;
}

export const GET = authed.route(
  async ({ user, context }): Promise<CreditsData> => {
    const { meterId } = (await context.params) as { meterId: string };
    const customerId = await getCustomerId(user.id);
    const hasCustomer = customerId !== null;
    const balance = await getCreditsBalance(user.id, meterId);

    return { balance, hasCustomer };
  }
);
