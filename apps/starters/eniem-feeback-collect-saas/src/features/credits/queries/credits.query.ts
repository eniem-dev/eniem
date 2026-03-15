import { createAuthenticatedQuery } from "@/lib/server-handler";
import { getCreditsBalance } from "../services/credits.service";
import type { CreditBalance } from "../models/credits.model";

export const getCreditsBalanceQuery = (meterId: string) =>
  createAuthenticatedQuery(async ({ user }): Promise<CreditBalance | null> => {
    return getCreditsBalance(user.id, meterId);
  });
