"use client";

import Script from "next/script";

import { env } from "@/config";
import { logger } from "@/lib/logger";

export function AnalyticsScript() {
  // Only render Umami script when Umami is the provider and properly configured
  // PostHog is initialized via instrumentation-client.ts
  if (env.analytics.provider !== "umami") {
    return null;
  }

  if (!env.analytics.umamiWebsiteId || !env.analytics.umamiHost) {
    logger.warn("Umami analytics enabled but missing configuration", {
      umamiWebsiteId: !!env.analytics.umamiWebsiteId,
      umamiHost: !!env.analytics.umamiHost,
    });
    return null;
  }

  return (
    <Script
      src={`${env.analytics.umamiHost}/script.js`}
      data-website-id={env.analytics.umamiWebsiteId}
      strategy="afterInteractive"
    />
  );
}
