import type { AnalyticsProvider } from "./types";

export const umamiProvider: AnalyticsProvider = {
  name: "umami",
  track: (event, properties) => {
    if (typeof window !== "undefined" && window.umami) {
      window.umami.track(event, properties);
    }
  },
  // Umami auto-tracks page views via script
};
