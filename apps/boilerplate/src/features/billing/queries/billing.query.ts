import { authed } from "@/lib/handler";
import { getUserSubscription } from "../services/subscription.service";
import { getCustomerId, getCustomerOrders } from "../services/billing.service";
import type { BillingData } from "../models/billing.model";

export const getBillingDataQuery = () =>
  authed.query(async ({ user }): Promise<BillingData> => {
    const subscription = await getUserSubscription(user.id);
    const customerId = await getCustomerId(user.id);
    const orders = customerId ? await getCustomerOrders(customerId) : [];

    return { subscription, orders };
  });
