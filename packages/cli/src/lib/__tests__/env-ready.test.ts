import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseEnvFile,
  generateProductionEnv,
  getPreCheckedGroups,
  REQUIRED_VARS,
  OPTIONAL_GROUPS,
  AUTO_SET_VARS,
} from "../env-ready.js";
import type { EnvReadyConfig } from "../env-ready.js";
import * as fs from "fs/promises";

vi.mock("fs/promises");

describe("env-ready", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("parseEnvFile", () => {
    it("correctly parses KEY=value pairs", async () => {
      vi.mocked(fs.readFile).mockResolvedValue("FOO=bar\nBAZ=qux\n");

      const result = await parseEnvFile("/path/.env");

      expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
    });

    it("skips comments and blank lines", async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        "# This is a comment\n\nFOO=bar\n\n# Another comment\nBAZ=qux\n",
      );

      const result = await parseEnvFile("/path/.env");

      expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
    });

    it("handles malformed lines (no = sign)", async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        "FOO=bar\nINVALID_LINE\nBAZ=qux\n",
      );

      const result = await parseEnvFile("/path/.env");

      expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
    });

    it("handles values containing = signs", async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        "DATABASE_URL=postgres://user:pass@host/db?opt=val\n",
      );

      const result = await parseEnvFile("/path/.env");

      expect(result).toEqual({
        DATABASE_URL: "postgres://user:pass@host/db?opt=val",
      });
    });

    it("returns empty object for empty file", async () => {
      vi.mocked(fs.readFile).mockResolvedValue("");

      const result = await parseEnvFile("/path/.env");

      expect(result).toEqual({});
    });

    it("propagates error when file does not exist", async () => {
      vi.mocked(fs.readFile).mockRejectedValue(
        new Error("ENOENT: no such file or directory"),
      );

      await expect(parseEnvFile("/path/.env")).rejects.toThrow("ENOENT");
    });
  });

  describe("generateProductionEnv", () => {
    const baseConfig: EnvReadyConfig = {
      required: {
        PROJECT_URL: "https://myapp.com",
        NEXT_PUBLIC_APP_NAME: "My App",
        DATABASE_URL: "postgres://host/db",
        BETTER_AUTH_SECRET: "secret123",
        POLAR_ACCESS_TOKEN: "polar_xx",
        POLAR_WEBHOOK_SECRET: "whsec_xx",
        POLAR_ORGANIZATION_ID: "org_xx",
        RESEND_API_KEY: "re_xx",
      },
      optional: {},
      autoSet: {
        BETTER_AUTH_URL: "https://myapp.com",
        NEXT_PUBLIC_SITE_URL: "https://myapp.com",
        POLAR_SERVER: "production",
      },
      selectedGroups: [],
      skippedGroups: [],
    };

    it("includes all required vars with provided values", () => {
      const output = generateProductionEnv(baseConfig);

      expect(output).toContain("PROJECT_URL=https://myapp.com");
      expect(output).toContain("NEXT_PUBLIC_APP_NAME=My App");
      expect(output).toContain("DATABASE_URL=postgres://host/db");
      expect(output).toContain("BETTER_AUTH_SECRET=secret123");
      expect(output).toContain("POLAR_ACCESS_TOKEN=polar_xx");
      expect(output).toContain("POLAR_WEBHOOK_SECRET=whsec_xx");
      expect(output).toContain("POLAR_ORGANIZATION_ID=org_xx");
      expect(output).toContain("RESEND_API_KEY=re_xx");
    });

    it("includes optional vars only for selected groups", () => {
      const config: EnvReadyConfig = {
        ...baseConfig,
        optional: {
          GITHUB_CLIENT_ID: "gh_id",
          GITHUB_CLIENT_SECRET: "gh_secret",
        },
        selectedGroups: ["github-oauth"],
        skippedGroups: [
          "twitter-oauth",
          "walletconnect",
          "analytics",
          "file-uploads",
          "email-branding",
          "site-config",
        ],
      };

      const output = generateProductionEnv(config);

      expect(output).toContain("GITHUB_CLIENT_ID=gh_id");
      expect(output).toContain("GITHUB_CLIENT_SECRET=gh_secret");
      expect(output).not.toContain("TWITTER_CLIENT_ID");
      expect(output).not.toContain("LANDING_MODE");
    });

    it("sets auto-derived values correctly", () => {
      const output = generateProductionEnv(baseConfig);

      expect(output).toContain("BETTER_AUTH_URL=https://myapp.com");
      expect(output).toContain("NEXT_PUBLIC_SITE_URL=https://myapp.com");
      expect(output).toContain("POLAR_SERVER=production");
    });

    it("excludes all optional vars when no groups selected", () => {
      const output = generateProductionEnv(baseConfig);

      expect(output).not.toContain("GITHUB_CLIENT_ID");
      expect(output).not.toContain("TWITTER_CLIENT_ID");
      expect(output).not.toContain("NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID");
      expect(output).not.toContain("NEXT_PUBLIC_ANALYTICS_PROVIDER");
      expect(output).not.toContain("DIGITALOCEAN_SPACES_ENDPOINT");
      expect(output).not.toContain("EMAIL_FROM_ADDRESS");
      expect(output).not.toContain("LANDING_MODE");
    });

    it("outputs analytics sub-selection vars for umami", () => {
      const config: EnvReadyConfig = {
        ...baseConfig,
        optional: {
          NEXT_PUBLIC_ANALYTICS_PROVIDER: "umami",
          NEXT_PUBLIC_UMAMI_HOST: "https://cloud.umami.is",
          NEXT_PUBLIC_UMAMI_WEBSITE_ID: "site-123",
        },
        selectedGroups: ["analytics"],
      };

      const output = generateProductionEnv(config);

      expect(output).toContain("NEXT_PUBLIC_ANALYTICS_PROVIDER=umami");
      expect(output).toContain(
        "NEXT_PUBLIC_UMAMI_HOST=https://cloud.umami.is",
      );
      expect(output).toContain("NEXT_PUBLIC_UMAMI_WEBSITE_ID=site-123");
      expect(output).not.toContain("NEXT_PUBLIC_POSTHOG_KEY");
    });
  });

  describe("getPreCheckedGroups", () => {
    it("returns correct group IDs based on existing values", () => {
      const existingEnv: Record<string, string> = {
        GITHUB_CLIENT_ID: "my-gh-id",
        GITHUB_CLIENT_SECRET: "my-gh-secret",
        NEXT_PUBLIC_UMAMI_HOST: "https://umami.example.com",
        NEXT_PUBLIC_UMAMI_WEBSITE_ID: "site-123",
      };

      const groups = getPreCheckedGroups(existingEnv);

      expect(groups).toContain("github-oauth");
      expect(groups).toContain("analytics");
      expect(groups).not.toContain("twitter-oauth");
      expect(groups).not.toContain("walletconnect");
      expect(groups).not.toContain("file-uploads");
      expect(groups).not.toContain("email-branding");
      expect(groups).not.toContain("site-config");
    });

    it("does not pre-check groups with only empty values", () => {
      const existingEnv: Record<string, string> = {
        GITHUB_CLIENT_ID: "",
        GITHUB_CLIENT_SECRET: "",
      };

      const groups = getPreCheckedGroups(existingEnv);

      expect(groups).not.toContain("github-oauth");
    });

    it("returns empty array when no env values match", () => {
      const groups = getPreCheckedGroups({});

      expect(groups).toEqual([]);
    });
  });

  describe("constants", () => {
    it("defines 8 required vars", () => {
      expect(REQUIRED_VARS).toHaveLength(8);
    });

    it("defines 7 optional groups", () => {
      expect(OPTIONAL_GROUPS).toHaveLength(7);
    });

    it("defines 3 auto-set vars", () => {
      expect(AUTO_SET_VARS).toHaveLength(3);
    });

    it("analytics group has subSelection config", () => {
      const analytics = OPTIONAL_GROUPS.find((g) => g.id === "analytics");

      expect(analytics?.subSelection).toBeDefined();
      expect(analytics?.subSelection?.options).toHaveLength(2);
    });

    it("each optional group has expected var count", () => {
      const expectedVarCounts: Record<string, number> = {
        "github-oauth": 2,
        "twitter-oauth": 2,
        walletconnect: 1,
        analytics: 0, // vars come from sub-selection options
        "file-uploads": 7,
        "email-branding": 3,
        "site-config": 1,
      };

      for (const group of OPTIONAL_GROUPS) {
        expect(group.vars).toHaveLength(expectedVarCounts[group.id]);
      }
    });
  });
});
