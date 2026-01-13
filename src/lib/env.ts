import { nanoid } from "nanoid";
import { writeFile } from "fs/promises";
import { join } from "path";
import type { AppConfig } from "../config/types.js";

/**
 * Generates the .env file content from collected configuration
 */
export function generateEnvContent(config: AppConfig): string {
  const lines: string[] = [];
  const betterAuthSecret = config.authSecret || nanoid(32);

  // Project Configuration
  lines.push("# Project Configuration");
  lines.push("PROJECT_URL=http://localhost:3000");
  lines.push("NEXT_PUBLIC_SITE_URL=http://localhost:3000");
  lines.push(`NEXT_PUBLIC_APP_NAME=${config.project?.name || "eniem"}`);

  // Better Auth Configuration
  lines.push("");
  lines.push("# Better Auth Configuration");
  lines.push(`BETTER_AUTH_SECRET=${betterAuthSecret}`);
  lines.push("BETTER_AUTH_URL=http://localhost:3000");

  // Database Configuration
  lines.push("");
  lines.push("# Database Configuration (PostgreSQL)");
  lines.push("DATABASE_URL=postgresql://eniem:eniem-dev-password@localhost:5432/eniem");

  // GitHub OAuth
  lines.push("");
  lines.push("# GitHub OAuth (optional - set up on GitHub to enable GitHub login)");
  lines.push(`GITHUB_CLIENT_ID=${config.oauth?.github?.clientId || ""}`);
  lines.push(`GITHUB_CLIENT_SECRET=${config.oauth?.github?.clientSecret || ""}`);

  // Twitter OAuth
  lines.push("");
  lines.push("# Twitter (X) OAuth (optional - set up on Twitter Developer Portal to enable Twitter login)");
  lines.push(`TWITTER_CLIENT_ID=${config.oauth?.twitter?.clientId || ""}`);
  lines.push(`TWITTER_CLIENT_SECRET=${config.oauth?.twitter?.clientSecret || ""}`);

  // WalletConnect
  lines.push("");
  lines.push("# WalletConnect (optional - for wallet connection support)");
  lines.push(`NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=${config.web3?.walletConnectProjectId || ""}`);

  // Landing Mode
  lines.push("");
  lines.push("# Landing Mode Configuration (set to \"true\" to enable landing mode)");
  lines.push("LANDING_MODE=false");

  // Analytics Configuration
  lines.push("");
  lines.push("# Analytics Configuration");
  lines.push("# Provider: \"umami\" (default), \"posthog\", or \"none\"");
  const analyticsProvider = config.analytics?.enabled ? (config.analytics.provider || "umami") : "none";
  lines.push(`NEXT_PUBLIC_ANALYTICS_PROVIDER=${analyticsProvider}`);

  // Umami Configuration
  lines.push("");
  lines.push("# Umami Configuration (when using umami provider)");
  lines.push("# Get your website ID from your Umami dashboard");
  const umamiWebsiteId = config.analytics?.provider === "umami" ? (config.analytics.siteId || "") : "";
  const umamiHost = config.analytics?.provider === "umami" ? (config.analytics.hostUrl || "https://cloud.umami.is") : "https://cloud.umami.is";
  lines.push(`NEXT_PUBLIC_UMAMI_WEBSITE_ID=${umamiWebsiteId}`);
  lines.push(`NEXT_PUBLIC_UMAMI_HOST=${umamiHost}`);

  // PostHog Configuration
  lines.push("");
  lines.push("# PostHog Configuration (when using posthog provider)");
  const posthogKey = config.analytics?.provider === "posthog" ? (config.analytics.siteId || "") : "";
  const posthogHost = config.analytics?.provider === "posthog" ? (config.analytics.hostUrl || "https://eu.posthog.com") : "https://eu.posthog.com";
  lines.push(`NEXT_PUBLIC_POSTHOG_KEY=${posthogKey}`);
  lines.push(`NEXT_PUBLIC_POSTHOG_HOST=${posthogHost}`);

  // DigitalOcean Spaces Configuration
  lines.push("");
  lines.push("# DigitalOcean Spaces Configuration (for file uploads)");
  lines.push("# Endpoint should be the region endpoint only (e.g., https://ams3.digitaloceanspaces.com)");
  lines.push("# Do NOT include the bucket name in the endpoint");
  lines.push(`DIGITALOCEAN_SPACES_ENDPOINT=${config.storage?.endpoint || "https://ams3.digitaloceanspaces.com"}`);
  lines.push(`DIGITALOCEAN_SPACES_REGION=${config.storage?.region || "ams3"}`);
  lines.push(`DIGITALOCEAN_SPACES_BUCKET=${config.storage?.bucket || ""}`);
  lines.push(`DIGITALOCEAN_SPACES_ACCESS_KEY_ID=${config.storage?.accessKeyId || ""}`);
  lines.push(`DIGITALOCEAN_SPACES_SECRET_ACCESS_KEY=${config.storage?.secretAccessKey || ""}`);
  lines.push("DIGITALOCEAN_SPACES_CDN=");
  lines.push("MAX_FILE_SIZE_MB=1");

  // Polar Configuration
  lines.push("");
  lines.push("# Polar Configuration (for payments and checkouts)");
  lines.push("# Get your access token from Polar Organization Settings");
  lines.push("# Use 'sandbox' for testing, 'production' for live payments");
  lines.push(`POLAR_ACCESS_TOKEN=${config.payment?.accessToken || ""}`);
  lines.push(`POLAR_SERVER=${config.payment?.server || "sandbox"}`);
  lines.push(`POLAR_WEBHOOK_SECRET=${config.payment?.webhookSecret || ""}`);

  // Email Configuration
  lines.push("");
  lines.push("# Email Configuration (Resend)");
  lines.push("# Get your API key from https://resend.com");
  lines.push("RESEND_API_KEY=");
  lines.push("EMAIL_FROM_ADDRESS=no-reply@eniem.dev");
  lines.push("EMAIL_BRAND_LOGO_URL=");

  // Add trailing newline
  lines.push("");

  return lines.join("\n");
}

export interface WriteEnvOptions {
  config: AppConfig;
  destination: string;
}

export interface WriteEnvResult {
  success: boolean;
  path: string;
  error?: string;
}

/**
 * Writes the .env file to the project root
 */
export async function writeEnvFile({
  config,
  destination,
}: WriteEnvOptions): Promise<WriteEnvResult> {
  const envPath = join(destination, ".env");
  const content = generateEnvContent(config);

  try {
    await writeFile(envPath, content, "utf-8");
    return {
      success: true,
      path: envPath,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      path: envPath,
      error: `Failed to write .env file: ${errorMessage}`,
    };
  }
}
