import { env } from "@/config";

import type { AnalyticsProvider, AnalyticsProviderType } from "./types";

const noopProvider: AnalyticsProvider = {
  name: "none",
  track: () => {},
};

// Lazy load providers to avoid importing posthog-js when not needed
let cachedProvider: AnalyticsProvider | null = null;

export function getAnalyticsProvider(): AnalyticsProvider {
  if (cachedProvider) return cachedProvider;

  const providerType = env.analytics.provider as AnalyticsProviderType;
  let provider: AnalyticsProvider;

  switch (providerType) {
    case "posthog":
      // Dynamic import to avoid loading posthog-js when using umami
      provider = require("./posthog").posthogProvider;
      break;
    case "umami":
      provider = require("./umami").umamiProvider;
      break;
    default:
      provider = noopProvider;
  }

  cachedProvider = provider;
  return provider;
}

export type { AnalyticsProvider, AnalyticsProviderType };
