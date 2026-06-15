export interface BillingOrder {
  id: string;
  createdAt: Date;
  status: string;
  totalAmount: number;
  currency: string;
  productName: string | null;
  description: string;
}

export interface Downloadable {
  id: string;
  name: string;
  size: number;
  sizeReadable: string;
  downloadUrl: string;
  expiresAt: Date;
}

export interface GitHubBenefit {
  id: string;
  repositoryOwner: string;
  repositoryName: string;
  repositoryUrl: string;
  permission: string;
  isGranted: boolean;
  grantedAt: Date | null;
  description: string;
}

export interface CreditBalance {
  meterId: string;
  balance: number;
  customerId: string;
}

export type UsageMetadata = Record<string, string | number | boolean>;

export interface UsageEvent {
  name: string;
  metadata?: UsageMetadata;
  timestamp?: Date;
}

export interface UsageHistoryEvent {
  id: string;
  name: string;
  timestamp: Date;
  metadata: UsageMetadata;
}

export interface UsageHistoryPagination {
  totalCount: number;
  maxPage: number;
  currentPage: number;
}

export interface UsageHistoryResult {
  events: UsageHistoryEvent[];
  pagination: UsageHistoryPagination;
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
