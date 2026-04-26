import type { SubscriptionResult } from "@/features/subscription";
import type { BillingOrder } from "@/lib/polar/polar-domain";

export type { BillingOrder };

export interface BillingData {
  subscription: SubscriptionResult | null;
  orders: BillingOrder[];
}
