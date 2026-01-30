import { env } from "@/config";

import { posthogProvider } from "./posthog";
import type { AnalyticsProvider, AnalyticsProviderType } from "./types";
import { umamiProvider } from "./umami";

const noopProvider: AnalyticsProvider = {
  name: "none",
  track: () => {},
};

export function getAnalyticsProvider(): AnalyticsProvider {
  const provider = env.analytics.provider as AnalyticsProviderType;

  switch (provider) {
    case "posthog":
      return posthogProvider;
    case "umami":
      return umamiProvider;
    default:
      return noopProvider;
  }
}

export type { AnalyticsProvider, AnalyticsProviderType };
