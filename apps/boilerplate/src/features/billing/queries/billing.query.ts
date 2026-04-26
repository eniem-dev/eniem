import { authed } from "@/lib/handler";
import { polar } from "@/lib/polar/index";
import { getUserSubscription } from "@/features/subscription";
import type { BillingData } from "../models/billing.model";

export const getBillingDataQuery = () =>
  authed.query(async ({ user }): Promise<BillingData> => {
    const subscription = await getUserSubscription(user.id);
    const orders = await polar.listUserOrders(user.id);

    return { subscription, orders };
  });
