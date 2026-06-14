import { syncSubscription } from "@/features/billing/server-api";
import { polar, polarClient } from "@/lib/polar";
import { logger } from "@/lib/logger";
import type { PolarSubscription } from "@/features/billing/server-api";

export { polarClient };
export { getCheckoutProducts as getPurchasableProducts } from "@/features/billing/server-api";
export { verifySiweMessage } from "@/features/authentication/services/siwe-verifier.service";
export type { PolarSubscription };

export async function onUserDeleted(userId: string): Promise<void> {
  logger.info("Deleting Polar customer for user", { userId });
  await polar.deleteUserCustomer(userId);
  logger.info("Polar customer deleted", { userId });
}

export async function onPolarCustomerStateChanged(
  userId: string,
  activeSubscriptions: PolarSubscription[]
): Promise<void> {
  await syncSubscription(userId, activeSubscriptions);
}
