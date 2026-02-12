export type AnalyticsProviderType = "umami" | "posthog" | "none";

export interface AnalyticsProvider {
  name: AnalyticsProviderType;
  track: (event: string, properties?: Record<string, unknown>) => void;
  identify?: (userId: string, traits?: Record<string, unknown>) => void;
  pageView?: (url?: string) => void;
}

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, unknown>) => void;
    };
  }
}
