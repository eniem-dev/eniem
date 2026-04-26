// Models
export type { BillingOrder, BillingData } from "./models/billing.model";
export type {
  SubscriptionResult,
  PolarSubscription,
} from "./models/subscription.model";
export type {
  CreditBalance,
  UsageMetadata,
  UsageEvent,
  UsageHistoryEvent,
  UsageHistoryPagination,
  UsageHistoryResult,
} from "./models/credits.model";

// Services
export { getCustomerId, getCustomerOrders } from "./services/billing.service";
export {
  getUserSubscription,
  hasActiveSubscription,
  syncSubscription,
  syncSubscriptionFromPolar,
  deleteSubscription,
} from "./services/subscription.service";
export {
  getCreditsBalance,
  hasCredits,
  assertHasCredits,
  ingestUsage,
} from "./services/credits.service";
export { getUsageHistory } from "./services/credits-usage.service";

// Queries
export { getBillingDataQuery } from "./queries/billing.query";
export { getSubscriptionQuery } from "./queries/subscription.query";
export { getCreditsBalanceQuery } from "./queries/credits.query";
export { getCreditsUsageQuery } from "./queries/credits-usage.query";

// Generated Products
export type {
  ProductDisplay,
  GeneratedProduct,
} from "./generated/products.generated";
export {
  sandboxProducts,
  productionProducts,
  getProducts,
  getCheckoutProducts,
  getDisplayProducts,
} from "./generated/products.generated";

// Generated Meters
export type {
  GeneratedMeter,
  MeterSlug,
  MeterEventNames,
} from "./generated/meters.generated";
export {
  sandboxMeters,
  productionMeters,
  getMeters,
  getMeter,
  resolveEventDisplayName,
} from "./generated/meters.generated";

// Hooks
export { useCredits } from "./hooks/use-credits";

// Components
export { BillingOverview } from "./components/billing-overview";
export { SubscriptionStatusCard } from "./components/subscription-status-card";
export { OrderHistoryCard } from "./components/order-history-card";
export { CreditBalance as CreditBalanceDisplay } from "./components/credit-balance";
export { CreditsUsageHistory } from "./components/credits-usage-history";

// Utils
export {
  formatCurrency,
  formatDate,
  formatShortDate,
  getSubscriptionStatusBadgeVariant,
  getOrderStatusBadgeVariant,
  type BadgeVariant,
} from "./billing.util";
