// Only initialize PostHog if it's the selected provider and properly configured
if (process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER === "posthog") {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    // Using console here as instrumentation runs before app modules are available
    console.warn(
      "[Analytics] PostHog enabled but NEXT_PUBLIC_POSTHOG_KEY is missing"
    );
  } else {
    import("posthog-js").then(({ default: posthog }) => {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: "/ingest",
        ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.posthog.com",
        defaults: "2025-05-24",
        capture_exceptions: true,
        debug: process.env.NODE_ENV === "development",
      });
    });
  }
}
// Umami uses script tag in layout - no client instrumentation needed
