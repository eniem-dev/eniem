// eslint-disable-next-line no-restricted-imports -- sole bridge between auth and feature modules
import { syncSubscription, getCheckoutProducts } from "@/features/billing";
import { polar, polarClient } from "@/lib/polar";
import type { PolarSubscription } from "@/lib/polar/polar-domain";
import { logger } from "@/lib/logger";

export { polarClient };
export type { PolarSubscription };

export async function onUserDeleted(userId: string): Promise<void> {
  logger.info("Deleting Polar customer for user", { userId });
  try {
    await polar.deleteUserCustomer(userId);
    logger.info("Polar customer deleted", { userId });
  } catch (error) {
    logger.error("Failed to delete Polar customer", {
      userId,
      error: error instanceof Error ? error.message : error,
    });
  }
}

export async function onPolarCustomerStateChanged(
  userId: string,
  activeSubscriptions: PolarSubscription[]
): Promise<void> {
  await syncSubscription(userId, activeSubscriptions);
}

export function getPurchasableProducts(polarServer: "sandbox" | "production") {
  return getCheckoutProducts(polarServer);
}
