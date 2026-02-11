/**
 * Application route constants for type-safe navigation
 * Provides centralized route management and prevents hardcoded URL strings
 * @example
 * ```typescript
 * import { routes } from "@/config/routes";
 *
 * // In components
 * <Link href={routes.auth.login}>Login</Link>
 *
 * // In redirects
 * redirect(routes.dashboard);
 *
 * // In router navigation
 * router.push(routes.stripe.success);
 * ```
 */
export const routes = {
  home: "/",
  landing: "/landing",
  homeRedirect: "/home",
  pricing: "/pricing",
  choosePlan: "/choose-plan",
  auth: {
    signup: "/signup",
    login: "/login",
    resetPassword: "/reset-password",
    forgotPassword: "/forgot-password",
  },

  blog: "/blog",
  dashboard: "/dashboard",
  legal: {
    termsOfService: "/terms-of-service",
    privacy: "/privacy",
  },
  account: {
    general: "/account/general",
    billing: "/account/billing",
    usage: "/account/usage",
  },
};
