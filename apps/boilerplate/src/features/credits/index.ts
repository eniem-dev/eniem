// Re-export shim — credits has been folded into @/features/billing.
// Slice 4 of #121 will codemod call sites and remove this stub entirely.

export type {
  GeneratedMeter,
  MeterSlug,
  MeterEventNames,
  CreditBalance,
  UsageMetadata,
  UsageEvent,
  UsageHistoryEvent,
  UsageHistoryPagination,
  UsageHistoryResult,
} from "@/features/billing";
export {
  sandboxMeters,
  productionMeters,
  getMeters,
  getMeter,
  resolveEventDisplayName,
  getCreditsBalance,
  hasCredits,
  assertHasCredits,
  ingestUsage,
  getUsageHistory,
  getCreditsBalanceQuery,
  getCreditsUsageQuery,
  useCredits,
  CreditBalanceDisplay,
  CreditsUsageHistory,
} from "@/features/billing";
