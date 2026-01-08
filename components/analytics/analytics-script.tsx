"use client";

import Script from "next/script";

import { env } from "@/config";

export function AnalyticsScript() {
  // Only render Umami script when Umami is the provider
  // PostHog is initialized via instrumentation-client.ts
  if (env.analytics.provider !== "umami") {
    return null;
  }

  return (
    <Script
      defer
      src={`${env.analytics.umamiHost}/script.js`}
      data-website-id={env.analytics.umamiWebsiteId}
    />
  );
}
