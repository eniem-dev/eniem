import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  async rewrites() {
    // Only add PostHog rewrites if PostHog is the analytics provider
    if (process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER === "posthog") {
      return [
        {
          source: "/ingest/static/:path*",
          destination: "https://eu-assets.i.posthog.com/static/:path*",
        },
        {
          source: "/ingest/:path*",
          destination: "https://eu.i.posthog.com/:path*",
        },
      ];
    }
    return [];
  },
  // Required for PostHog trailing slash API requests
  skipTrailingSlashRedirect: process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER === "posthog",
};

// Use string-based plugin specification for Turbopack compatibility
// https://nextjs.org/docs/app/guides/mdx#using-plugins-with-turbopack
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: [
      [
        "rehype-pretty-code",
        {
          theme: {
            light: "catppuccin-latte",
            dark: "catppuccin-mocha",
          },
          keepBackground: false,
        },
      ],
    ],
  },
});

export default withMDX(nextConfig);
