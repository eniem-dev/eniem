import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";

import { env } from "@/config";
import { logger } from "@/lib/logger";
import {
  getPurchasableProducts,
  onPolarCustomerStateChanged,
  polarClient,
} from "../side-effects";
import type { PolarSubscription } from "../side-effects";

interface CustomerStateChangedPayload {
  data: {
    externalId: string | null | undefined;
    activeSubscriptions: PolarSubscription[] | null | undefined;
  };
}

export async function onCustomerStateChanged(
  payload: CustomerStateChangedPayload
): Promise<void> {
  const { externalId, activeSubscriptions } = payload.data;
  logger.info("Polar: Customer state changed", { externalId });

  if (externalId) {
    await onPolarCustomerStateChanged(externalId, activeSubscriptions || []);
  }
}

export const polarPlugin = polar({
  client: polarClient,
  createCustomerOnSignUp: true,
  use: [
    checkout({
      products: getPurchasableProducts(env.payment.polarServer),
      successUrl: "/success?checkout_id={CHECKOUT_ID}",
      authenticatedUsersOnly: true,
    }),
    portal(),
    usage(),
    webhooks({
      secret: env.payment.polarWebhookSecret,
      onCustomerStateChanged,
      onOrderPaid: async (payload) => {
        logger.info("Polar: Order paid", {
          orderId: payload.data.id,
          userId: payload.data.customer?.externalId,
          product: payload.data.product.name,
        });
      },
      onPayload: async (payload) => {
        logger.info("Polar: Webhook received", { payload });
      },
    }),
  ],
});
