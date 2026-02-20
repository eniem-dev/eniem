import { readFile } from "fs/promises";

// --- Types ---

export interface RequiredVar {
  key: string;
  promptLabel: string;
  notes?: string;
}

export interface GroupVar {
  key: string;
  promptLabel: string;
}

export interface SubSelectionOption {
  value: string;
  label: string;
  vars: GroupVar[];
  autoSet?: Record<string, string>;
}

export interface OptionalGroup {
  id: string;
  name: string;
  label: string;
  vars: GroupVar[];
  subSelection?: {
    prompt: string;
    options: SubSelectionOption[];
  };
}

export interface AutoSetVar {
  key: string;
  derivedFrom?: string;
  value?: string;
}

export interface EnvReadyConfig {
  required: Record<string, string>;
  optional: Record<string, string>;
  autoSet: Record<string, string>;
  selectedGroups: string[];
  skippedGroups: string[];
}

// --- Constants ---

export const REQUIRED_VARS: RequiredVar[] = [
  {
    key: "PROJECT_URL",
    promptLabel: "Production URL (e.g. https://myapp.com)",
    notes: "Also sets NEXT_PUBLIC_SITE_URL and BETTER_AUTH_URL",
  },
  { key: "NEXT_PUBLIC_APP_NAME", promptLabel: "App name" },
  { key: "DATABASE_URL", promptLabel: "Database connection string" },
  { key: "BETTER_AUTH_SECRET", promptLabel: "Auth secret key" },
  { key: "POLAR_ACCESS_TOKEN", promptLabel: "Polar access token" },
  { key: "POLAR_WEBHOOK_SECRET", promptLabel: "Polar webhook secret" },
  { key: "POLAR_ORGANIZATION_ID", promptLabel: "Polar organization ID" },
  { key: "RESEND_API_KEY", promptLabel: "Resend API key" },
];

export const OPTIONAL_GROUPS: OptionalGroup[] = [
  {
    id: "github-oauth",
    name: "GitHub OAuth",
    label: "GitHub OAuth",
    vars: [
      { key: "GITHUB_CLIENT_ID", promptLabel: "GitHub OAuth client ID" },
      {
        key: "GITHUB_CLIENT_SECRET",
        promptLabel: "GitHub OAuth client secret",
      },
    ],
  },
  {
    id: "twitter-oauth",
    name: "Twitter/X OAuth",
    label: "Twitter/X OAuth",
    vars: [
      { key: "TWITTER_CLIENT_ID", promptLabel: "Twitter/X client ID" },
      {
        key: "TWITTER_CLIENT_SECRET",
        promptLabel: "Twitter/X client secret",
      },
    ],
  },
  {
    id: "walletconnect",
    name: "WalletConnect (Web3)",
    label: "WalletConnect (Web3)",
    vars: [
      {
        key: "NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID",
        promptLabel: "WalletConnect project ID",
      },
    ],
  },
  {
    id: "analytics",
    name: "Analytics",
    label: "Analytics",
    vars: [],
    subSelection: {
      prompt: "Which analytics provider?",
      options: [
        {
          value: "umami",
          label: "Umami",
          vars: [
            {
              key: "NEXT_PUBLIC_UMAMI_HOST",
              promptLabel: "Umami host URL",
            },
            {
              key: "NEXT_PUBLIC_UMAMI_WEBSITE_ID",
              promptLabel: "Umami website ID",
            },
          ],
          autoSet: { NEXT_PUBLIC_ANALYTICS_PROVIDER: "umami" },
        },
        {
          value: "posthog",
          label: "PostHog",
          vars: [
            {
              key: "NEXT_PUBLIC_POSTHOG_HOST",
              promptLabel: "PostHog host URL",
            },
            {
              key: "NEXT_PUBLIC_POSTHOG_KEY",
              promptLabel: "PostHog project API key",
            },
          ],
          autoSet: { NEXT_PUBLIC_ANALYTICS_PROVIDER: "posthog" },
        },
      ],
    },
  },
  {
    id: "file-uploads",
    name: "File Uploads (DigitalOcean Spaces)",
    label: "File Uploads (DigitalOcean Spaces)",
    vars: [
      {
        key: "DIGITALOCEAN_SPACES_ENDPOINT",
        promptLabel: "Spaces endpoint URL",
      },
      { key: "DIGITALOCEAN_SPACES_REGION", promptLabel: "Spaces region" },
      { key: "DIGITALOCEAN_SPACES_BUCKET", promptLabel: "Bucket name" },
      {
        key: "DIGITALOCEAN_SPACES_ACCESS_KEY_ID",
        promptLabel: "Spaces access key",
      },
      {
        key: "DIGITALOCEAN_SPACES_SECRET_ACCESS_KEY",
        promptLabel: "Spaces secret key",
      },
      { key: "DIGITALOCEAN_SPACES_CDN", promptLabel: "CDN URL (optional)" },
      { key: "MAX_FILE_SIZE_MB", promptLabel: "Max upload size in MB" },
    ],
  },
  {
    id: "email-branding",
    name: "Email Branding",
    label: "Email Branding",
    vars: [
      { key: "EMAIL_FROM_ADDRESS", promptLabel: "From email address" },
      {
        key: "EMAIL_BRAND_LOGO_URL",
        promptLabel: "Brand logo URL for emails",
      },
      { key: "SUPPORT_EMAIL", promptLabel: "Support email address" },
    ],
  },
  {
    id: "site-config",
    name: "Site Config (Landing Mode)",
    label: "Site Config (Landing Mode)",
    vars: [
      { key: "LANDING_MODE", promptLabel: "Landing mode (true/false)" },
    ],
  },
];

export const AUTO_SET_VARS: AutoSetVar[] = [
  { key: "BETTER_AUTH_URL", derivedFrom: "PROJECT_URL" },
  { key: "NEXT_PUBLIC_SITE_URL", derivedFrom: "PROJECT_URL" },
  { key: "POLAR_SERVER", value: "production" },
];

// --- Functions ---

/**
 * Parses a .env file and returns key-value pairs.
 * Skips comments, blank lines, and malformed lines (no = sign).
 */
export async function parseEnvFile(
  filePath: string,
): Promise<Record<string, string>> {
  const content = await readFile(filePath, "utf-8");
  const result: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1);
    if (key) result[key] = value;
  }

  return result;
}

/**
 * Collects all promptable var keys from a group (direct vars + sub-selection vars).
 * Excludes autoSet keys since those are derived, not prompted.
 */
function getAllGroupVarKeys(group: OptionalGroup): string[] {
  const keys = group.vars.map((v) => v.key);
  if (group.subSelection) {
    for (const option of group.subSelection.options) {
      keys.push(...option.vars.map((v) => v.key));
    }
  }
  return keys;
}

/**
 * Returns group IDs that already have non-empty values in the existing env.
 * Used to pre-check groups in the optional features checklist.
 */
export function getPreCheckedGroups(
  existingEnv: Record<string, string>,
): string[] {
  return OPTIONAL_GROUPS.filter((group) => {
    const keys = getAllGroupVarKeys(group);
    return keys.some((key) => key in existingEnv && existingEnv[key] !== "");
  }).map((group) => group.id);
}

/**
 * Generates a production .env file string from the collected configuration.
 */
export function generateProductionEnv(config: EnvReadyConfig): string {
  const lines: string[] = [];

  // Project Configuration
  lines.push("# Project Configuration");
  lines.push(`PROJECT_URL=${config.required.PROJECT_URL ?? ""}`);
  lines.push(
    `NEXT_PUBLIC_SITE_URL=${config.autoSet.NEXT_PUBLIC_SITE_URL ?? ""}`,
  );
  lines.push(
    `NEXT_PUBLIC_APP_NAME=${config.required.NEXT_PUBLIC_APP_NAME ?? ""}`,
  );

  // Auth
  lines.push("");
  lines.push("# Auth");
  lines.push(
    `BETTER_AUTH_SECRET=${config.required.BETTER_AUTH_SECRET ?? ""}`,
  );
  lines.push(`BETTER_AUTH_URL=${config.autoSet.BETTER_AUTH_URL ?? ""}`);

  // Database
  lines.push("");
  lines.push("# Database");
  lines.push(`DATABASE_URL=${config.required.DATABASE_URL ?? ""}`);

  // Payments
  lines.push("");
  lines.push("# Payments (Polar)");
  lines.push(
    `POLAR_ACCESS_TOKEN=${config.required.POLAR_ACCESS_TOKEN ?? ""}`,
  );
  lines.push(`POLAR_SERVER=${config.autoSet.POLAR_SERVER ?? "production"}`);
  lines.push(
    `POLAR_WEBHOOK_SECRET=${config.required.POLAR_WEBHOOK_SECRET ?? ""}`,
  );
  lines.push(
    `POLAR_ORGANIZATION_ID=${config.required.POLAR_ORGANIZATION_ID ?? ""}`,
  );

  // Email
  lines.push("");
  lines.push("# Email (Resend)");
  lines.push(`RESEND_API_KEY=${config.required.RESEND_API_KEY ?? ""}`);

  // Optional groups
  for (const groupId of config.selectedGroups) {
    const group = OPTIONAL_GROUPS.find((g) => g.id === groupId);
    if (!group) continue;

    lines.push("");
    lines.push(`# ${group.name}`);

    for (const v of group.vars) {
      lines.push(`${v.key}=${config.optional[v.key] ?? ""}`);
    }

    if (group.subSelection) {
      for (const option of group.subSelection.options) {
        if (!option.autoSet) continue;
        const isSelected = Object.entries(option.autoSet).every(
          ([key, val]) => config.optional[key] === val,
        );
        if (isSelected) {
          for (const [key, val] of Object.entries(option.autoSet)) {
            lines.push(`${key}=${val}`);
          }
          for (const v of option.vars) {
            lines.push(`${v.key}=${config.optional[v.key] ?? ""}`);
          }
        }
      }
    }
  }

  lines.push("");
  return lines.join("\n");
}
