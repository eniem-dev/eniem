import type { Order } from "@polar-sh/sdk/models/components/order.js";
import type { CustomerStateSubscription } from "@polar-sh/sdk/models/components/customerstatesubscription.js";
/* eslint-disable no-restricted-imports */
import type { BillingOrder } from "@/features/billing/models/billing.model";
import type { PolarSubscription } from "@/features/subscription/models/subscription.model";
/* eslint-enable no-restricted-imports */

export function mapOrderToBillingOrder(order: Order): BillingOrder {
  return {
    id: order.id,
    createdAt: order.createdAt,
    status: order.status,
    totalAmount: order.totalAmount,
    currency: order.currency,
    productName: order.product?.name ?? null,
    description: order.product?.description || "",
  };
}

export function mapSubscriptionToDomain(
  sub: CustomerStateSubscription
): PolarSubscription {
  return {
    id: sub.id,
    createdAt: sub.createdAt,
    modifiedAt: sub.modifiedAt,
    status: sub.status,
    amount: sub.amount,
    currency: sub.currency,
    recurringInterval: sub.recurringInterval,
    currentPeriodStart: sub.currentPeriodStart ?? null,
    currentPeriodEnd: sub.currentPeriodEnd ?? null,
    trialStart: sub.trialStart ?? null,
    trialEnd: sub.trialEnd ?? null,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    canceledAt: sub.canceledAt ?? null,
    startedAt: sub.startedAt ?? null,
    endsAt: sub.endsAt ?? null,
    productId: sub.productId,
    discountId: sub.discountId ?? null,
  };
}
