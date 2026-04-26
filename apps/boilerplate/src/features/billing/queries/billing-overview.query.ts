import { authed } from "@/lib/handler";
import { getCustomerId, getCustomerOrders } from "../services/billing.service";
import { getUserSubscription } from "../services/subscription.service";
import type { BillingOverview } from "../models/billing.model";

export const getBillingOverviewQuery = () =>
  authed.query(async ({ user }): Promise<BillingOverview> => {
    const [subscription, customerId] = await Promise.all([
      getUserSubscription(user.id),
      getCustomerId(user.id),
    ]);
    const orders = customerId ? await getCustomerOrders(customerId) : [];

    return { subscription, orders };
  });
