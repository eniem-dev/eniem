// Re-export shim. Subscription has been folded into the billing feature.
// New code should import from `@/features/billing` directly.
export type {
  SubscriptionResult,
  PolarSubscription,
  ProductDisplay,
  GeneratedProduct,
} from "@/features/billing";
export {
  getUserSubscription,
  hasActiveSubscription,
  syncSubscription,
  syncSubscriptionFromPolar,
  deleteSubscription,
  getSubscriptionQuery,
  sandboxProducts,
  productionProducts,
  getProducts,
  getCheckoutProducts,
  getDisplayProducts,
} from "@/features/billing";
