import type { SubscriptionResult } from "./subscription.model";

export interface BillingOrder {
  id: string;
  createdAt: Date;
  status: string;
  totalAmount: number;
  currency: string;
  productName: string | null;
  description: string;
}

export interface BillingData {
  subscription: SubscriptionResult | null;
  orders: BillingOrder[];
}
