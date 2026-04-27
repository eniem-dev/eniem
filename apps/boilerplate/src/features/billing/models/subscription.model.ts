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

export type { PolarSubscription } from "@/lib/polar/polar-domain";
