import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";

import { env } from "@/config";
import { logger } from "@/lib/logger";
import * as sideEffects from "../side-effects";

export const polarPlugin = polar({
  client: sideEffects.polarClient,
  createCustomerOnSignUp: true,
  use: [
    checkout({
      products: sideEffects.getPurchasableProducts(env.payment.polarServer),
      successUrl: "/success?checkout_id={CHECKOUT_ID}",
      authenticatedUsersOnly: true,
    }),
    portal(),
    usage(),
    webhooks({
      secret: env.payment.polarWebhookSecret,
      onCustomerStateChanged: async (payload) => {
        const { externalId, activeSubscriptions } = payload.data;
        logger.info("Polar: Customer state changed", { externalId, payload });

        if (externalId) {
          await sideEffects.onPolarCustomerStateChanged(
            externalId,
            activeSubscriptions || []
          );
        }

        logger.info("Polar: Customer state changed", { payload });
      },
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
