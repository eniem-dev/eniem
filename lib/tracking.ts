import posthog from "posthog-js";

export function captureEvent(eventName: string, properties?: Record<string, unknown>) {
  posthog.capture(eventName, properties);
}
