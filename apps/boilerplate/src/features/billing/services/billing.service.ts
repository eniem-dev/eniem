import { polarClient } from "@/lib/polar";
import { logger } from "@/lib/logger";
import { ResourceNotFound } from "@polar-sh/sdk/models/errors/resourcenotfound.js";
import type { BillingOrder } from "../models/billing.model";

/**
 * Resolves a Polar customer ID from the app user ID.
 *
 * Polar creates a customer record when a user makes a purchase or subscribes.
 * This function looks up the Polar customer by the external ID (our user ID).
 *
 * @param userId - The app user ID (used as externalId in Polar)
 * @returns The Polar customer ID, or null if no subscription/purchase exists
 */
export async function getCustomerId(userId: string): Promise<string | null> {
  try {
    const customer = await polarClient.customers.getExternal({
      externalId: userId,
    });
    return customer.id;
  } catch (error) {
    // User has no subscription/purchase - expected case, return null cleanly
    if (error instanceof ResourceNotFound) {
      return null;
    }

    // Unexpected error (API failure, network issue, etc.) - log and return null
    logger.error("Failed to get Polar customer ID", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
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
