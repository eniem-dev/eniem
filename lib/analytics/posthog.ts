import posthog from "posthog-js";

import type { AnalyticsProvider } from "./types";

export const posthogProvider: AnalyticsProvider = {
  name: "posthog",
  track: (event, properties) => posthog.capture(event, properties),
  identify: (userId, traits) => posthog.identify(userId, traits),
  pageView: (url) => posthog.capture("$pageview", { $current_url: url }),
};
