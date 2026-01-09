import posthog from "posthog-js";

import type { AnalyticsProvider } from "./types";

// posthog-js is initialized in instrumentation-client.ts
// Only call methods on client side to avoid SSR issues
const isClient = typeof window !== "undefined";

export const posthogProvider: AnalyticsProvider = {
  name: "posthog",
  track: (event, properties) => isClient && posthog.capture(event, properties),
  identify: (userId, traits) => isClient && posthog.identify(userId, traits),
  pageView: (url) => isClient && posthog.capture("$pageview", { $current_url: url }),
};
