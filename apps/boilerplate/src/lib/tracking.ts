import posthog from "posthog-js";

import { env } from "@/config";

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, unknown>) => void;
    };
  }
}

export function captureEvent(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;

  switch (env.analytics.provider) {
    case "posthog":
      posthog.capture(event, properties);
      return;
    case "umami":
      window.umami?.track(event, properties);
      return;
    case "none":
    default:
      return;
  }
}
