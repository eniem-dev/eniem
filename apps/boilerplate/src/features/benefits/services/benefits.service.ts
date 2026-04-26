import { polar } from "@/lib/polar/index";

export async function hasActiveOrder(userId: string): Promise<boolean> {
  return polar.hasAnyBenefitGrant(userId);
}
