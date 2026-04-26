// Models
export type { BillingOrder, BillingData } from "./models/billing.model";
export type {
  SubscriptionResult,
  PolarSubscription,
} from "./models/subscription.model";

// Services
export { getCustomerId, getCustomerOrders } from "./services/billing.service";
export {
  getUserSubscription,
  hasActiveSubscription,
  syncSubscription,
  syncSubscriptionFromPolar,
  deleteSubscription,
} from "./services/subscription.service";

// Queries
export { getBillingDataQuery } from "./queries/billing.query";
export { getSubscriptionQuery } from "./queries/subscription.query";

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

// Components
export { BillingOverview } from "./components/billing-overview";
export { SubscriptionStatusCard } from "./components/subscription-status-card";
export { OrderHistoryCard } from "./components/order-history-card";

// Utils
export {
  formatCurrency,
  formatDate,
  formatShortDate,
  getSubscriptionStatusBadgeVariant,
  getOrderStatusBadgeVariant,
  type BadgeVariant,
} from "./billing.util";
