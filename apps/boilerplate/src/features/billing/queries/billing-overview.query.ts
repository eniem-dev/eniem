import { authed } from "@/lib/handler";
import { polar } from "@/lib/polar/index";
import { getUserSubscription } from "../services/subscription.service";
import type { BillingData } from "../models/billing.model";

export const getBillingOverviewQuery = () =>
  authed.query(async ({ user }): Promise<BillingData> => {
    const [subscription, orders] = await Promise.all([
      getUserSubscription(user.id),
      polar.listUserOrders(user.id),
    ]);

    return { subscription, orders };
  });
