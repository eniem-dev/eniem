import { createAuthenticatedQuery } from "@/lib/server-handler";
import { polar } from "@/lib/polar/index";
import { getUserSubscription } from "@/features/subscription";
import type { BillingData } from "../models/billing.model";

export const getBillingDataQuery = () =>
  createAuthenticatedQuery(async ({ user }): Promise<BillingData> => {
    const subscription = await getUserSubscription(user.id);
    const orders = await polar.listUserOrders(user.id);

    return { subscription, orders };
  });
