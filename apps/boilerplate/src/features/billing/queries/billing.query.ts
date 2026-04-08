import { createAuthenticatedQuery } from "@/lib/server-handler";
import { getUserSubscription } from "@/features/subscription";
import { getCustomerId, getCustomerOrders } from "../services/billing.service";
import type { BillingData } from "../models/billing.model";

export const getBillingDataQuery = () =>
  createAuthenticatedQuery(async ({ user }): Promise<BillingData> => {
    const subscription = await getUserSubscription(user.id);
    const customerId = await getCustomerId(user.id);
    const orders = customerId ? await getCustomerOrders(customerId) : [];

    return { subscription, orders };
  });
