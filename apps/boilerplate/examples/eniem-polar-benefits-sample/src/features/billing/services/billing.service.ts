import { polarClient } from "@/lib/polar";
import { logger } from "@/lib/logger";
import type { BillingOrder } from "../models/billing.model";

export async function getCustomerId(userId: string): Promise<string | null> {
  try {
    const customer = await polarClient.customers.getExternal({
      externalId: userId,
    });
    return customer.id;
  } catch (error) {
    logger.error("Failed to get customer ID", { userId, error });
    return null;
  }
}

export async function getCustomerOrders(
  customerId: string
): Promise<BillingOrder[]> {
  try {
    const response = await polarClient.orders.list({
      customerId,
      limit: 20,
    });

    const { result } = response;

    const orders: BillingOrder[] =
      result.items?.map((order) => ({
        id: order.id,
        createdAt: order.createdAt,
        status: order.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
        productName: order.product?.name ?? null,
        description: order.product?.description || "",
      })) || [];

    return orders;
  } catch (error) {
    logger.error("Failed to fetch customer orders", { customerId, error });
    return [];
  }
}
