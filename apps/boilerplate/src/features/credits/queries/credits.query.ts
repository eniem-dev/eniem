import { authed } from "@/lib/handler";
import { getCreditsBalance } from "../services/credits.service";
import type { CreditBalance } from "../models/credits.model";

export const getCreditsBalanceQuery = (meterId: string) =>
  authed.query(async ({ user }): Promise<CreditBalance | null> => {
    return getCreditsBalance(user.id, meterId);
  });
