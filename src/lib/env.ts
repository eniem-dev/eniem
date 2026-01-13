import { nanoid } from "nanoid";
import { writeFile } from "fs/promises";
import { join } from "path";
import type { AppConfig } from "../config/types.js";

/**
 * Generates the .env file content from collected configuration
 */
export function generateEnvContent(config: AppConfig): string {
  const lines: string[] = [];

  // Core project configuration
  lines.push("# Project Configuration");
  lines.push(`PROJECT_URL=${config.project?.url || ""}`);

  // Better Auth - auto-generate secret if empty
  const betterAuthSecret = config.project?.secret || nanoid(32);
  lines.push(`BETTER_AUTH_SECRET=${betterAuthSecret}`);

  // Database URL (from auth config)
  if (config.auth?.enabled && config.auth.databaseUrl) {
    lines.push(`DATABASE_URL=${config.auth.databaseUrl}`);
  }

  // OAuth - GitHub
  if (config.oauth?.github) {
    lines.push("");
    lines.push("# GitHub OAuth");
    lines.push(`GITHUB_CLIENT_ID=${config.oauth.github.clientId}`);
    lines.push(`GITHUB_CLIENT_SECRET=${config.oauth.github.clientSecret}`);
  }

  // OAuth - Twitter
  if (config.oauth?.twitter) {
    lines.push("");
    lines.push("# Twitter OAuth");
    lines.push(`TWITTER_CLIENT_ID=${config.oauth.twitter.clientId}`);
    lines.push(`TWITTER_CLIENT_SECRET=${config.oauth.twitter.clientSecret}`);
  }

  // Payment - Polar
  if (config.payment?.enabled) {
    lines.push("");
    lines.push("# Polar Payment");
    if (config.payment.accessToken) {
      lines.push(`POLAR_ACCESS_TOKEN=${config.payment.accessToken}`);
    }
    if (config.payment.organizationId) {
      lines.push(`POLAR_ORGANIZATION_ID=${config.payment.organizationId}`);
    }
    if (config.payment.webhookSecret) {
      lines.push(`POLAR_WEBHOOK_SECRET=${config.payment.webhookSecret}`);
    }
  }

  // Storage - DigitalOcean Spaces
  if (config.storage?.enabled) {
    lines.push("");
    lines.push("# DigitalOcean Spaces Storage");
    if (config.storage.endpoint) {
      lines.push(`DO_SPACES_ENDPOINT=${config.storage.endpoint}`);
    }
    if (config.storage.bucket) {
      lines.push(`DO_SPACES_BUCKET=${config.storage.bucket}`);
    }
    if (config.storage.accessKeyId) {
      lines.push(`DO_SPACES_ACCESS_KEY_ID=${config.storage.accessKeyId}`);
    }
    if (config.storage.secretAccessKey) {
      lines.push(`DO_SPACES_SECRET_ACCESS_KEY=${config.storage.secretAccessKey}`);
    }
    if (config.storage.region) {
      lines.push(`DO_SPACES_REGION=${config.storage.region}`);
    }
  }

  // Web3 - WalletConnect
  if (config.web3?.enabled && config.web3.walletConnectProjectId) {
    lines.push("");
    lines.push("# WalletConnect");
    lines.push(`WALLETCONNECT_PROJECT_ID=${config.web3.walletConnectProjectId}`);
  }

  // Analytics
  if (config.analytics?.enabled && config.analytics.provider !== "none") {
    lines.push("");
    lines.push("# Analytics");
    lines.push(`ANALYTICS_PROVIDER=${config.analytics.provider}`);
    if (config.analytics.siteId) {
      lines.push(`ANALYTICS_SITE_ID=${config.analytics.siteId}`);
    }
    if (config.analytics.apiKey) {
      lines.push(`ANALYTICS_API_KEY=${config.analytics.apiKey}`);
    }
  }

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
