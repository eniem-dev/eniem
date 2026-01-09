import type { AnalyticsProvider } from "./types";

function getPostHog() {
  if (typeof window !== "undefined") {
    // posthog-js is initialized in instrumentation-client.ts
    // Access it dynamically to avoid SSR issues
    return require("posthog-js").default;
  }
  return null;
}

export const posthogProvider: AnalyticsProvider = {
  name: "posthog",
  track: (event, properties) => getPostHog()?.capture(event, properties),
  identify: (userId, traits) => getPostHog()?.identify(userId, traits),
  pageView: (url) => getPostHog()?.capture("$pageview", { $current_url: url }),
};
