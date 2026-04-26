import posthog from "posthog-js";

import { env } from "@/config";
import { logger } from "@/lib/logger";

declare global {
  interface Window {
    umami?: {
      track: (event: string, properties?: Record<string, unknown>) => void;
    };
  }
}

export function captureEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;

  switch (env.analytics.provider) {
    case "posthog":
      posthog.capture(event, properties);
      break;
    case "umami":
      window.umami?.track(event, properties);
      break;
    case "none":
      break;
    default: {
      const _exhaustive: never = env.analytics.provider;
      logger.error(`Unknown analytics provider: ${_exhaustive}`);
    }
  }
}
