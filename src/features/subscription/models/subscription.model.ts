export interface SubscriptionResult {
  id: string;
  polarSubscriptionId: string;
  polarProductId: string;
  status: string;
  recurringInterval: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  startedAt: Date;
  amount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface PolarSubscription {
  id: string;
  createdAt: Date;
  modifiedAt: Date | null;
  status: string;
  amount: number;
  currency: string;
  recurringInterval: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  startedAt: Date | null;
  endsAt: Date | null;
  productId: string;
  discountId: string | null;
}
