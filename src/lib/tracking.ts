import { getAnalyticsProvider } from "./analytics";

export function captureEvent(eventName: string, properties?: Record<string, unknown>) {
  getAnalyticsProvider().track(eventName, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  getAnalyticsProvider().identify?.(userId, traits);
}
