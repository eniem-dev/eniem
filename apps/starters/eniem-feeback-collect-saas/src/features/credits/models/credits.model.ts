export interface CreditBalance {
  meterId: string;
  balance: number;
  customerId: string;
}

/**
 * Event metadata type for usage ingestion.
 * Values can be string, number, or boolean per Polar SDK constraints.
 */
export type UsageMetadata = Record<string, string | number | boolean>;

/**
 * Single usage event for ingestion.
 */
export interface UsageEvent {
  name: string;
  metadata?: UsageMetadata;
  timestamp?: Date;
}

export interface UsageHistoryEvent {
  id: string;
  name: string;
  timestamp: Date;
  metadata: Record<string, string | number | boolean>;
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
