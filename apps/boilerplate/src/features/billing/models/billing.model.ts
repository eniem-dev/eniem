import type { BillingOrder } from "@/lib/polar/polar-domain";

import type { SubscriptionResult } from "./subscription.model";

export type { BillingOrder };

export interface BillingData {
  subscription: SubscriptionResult | null;
  orders: BillingOrder[];
}
