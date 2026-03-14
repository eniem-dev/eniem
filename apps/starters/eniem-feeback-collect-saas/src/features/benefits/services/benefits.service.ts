import { polarClient } from "@/lib/polar";
import { logger } from "@/lib/logger";

export async function hasActiveOrder(userId: string): Promise<boolean> {
  try {
    const customerSession = await polarClient.customerSessions.create({
      externalCustomerId: userId,
    });

    const response = await polarClient.customerPortal.benefitGrants.list(
      { customerSession: customerSession.token },
      {}
    );

    const hasBenefits = (response.result.items?.length ?? 0) > 0;

    logger.info("Checked benefit grants for access", {
      userId,
      hasBenefits,
      count: response.result.items?.length ?? 0,
    });

    return hasBenefits;
  } catch (error) {
    logger.error("Failed to check benefit grants", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
