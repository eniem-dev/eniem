import { syncSubscription } from "@/features/billing/server-api";
import { polar, polarClient } from "@/lib/polar";
import { logger } from "@/lib/logger";
import type { PolarSubscription } from "@/features/billing/server-api";

export { polarClient };
export { getCheckoutProducts as getPurchasableProducts } from "@/features/billing/server-api";
export { verifySiweMessage } from "@/features/authentication/services/siwe-verifier.service";
export type { PolarSubscription };

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }
  return "Unknown Polar cleanup error";
}

export async function onUserDeleted(userId: string): Promise<void> {
  logger.info("Deleting Polar customer for user", { userId });
  try {
    await polar.deleteUserCustomer(userId);
    logger.info("Polar customer cleanup finished", { userId });
  } catch (error) {
    logger.error("Polar customer cleanup failed after user deletion", {
      userId,
      error: safeErrorMessage(error),
    });
  }
}

export async function onPolarCustomerStateChanged(
  userId: string,
  activeSubscriptions: PolarSubscription[]
): Promise<void> {
  await syncSubscription(userId, activeSubscriptions);
}
