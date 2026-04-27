import type { BillingOrder } from "@/lib/polar/polar-domain";

import type { SubscriptionResult } from "./subscription.model";

export type { BillingOrder };

export interface BillingOverview {
  subscription: SubscriptionResult | null;
  orders: BillingOrder[];
}
