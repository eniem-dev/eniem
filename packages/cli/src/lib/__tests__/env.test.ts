import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateEnvContent, writeEnvFile } from "../env.js";
import type { AppConfig } from "../../config/types.js";
import * as fs from "fs/promises";
import * as path from "path";

vi.mock("fs/promises");
vi.mock("nanoid", () => ({
  nanoid: () => "mock-nanoid-secret-32chars-here",
}));

describe("env", () => {
  describe("generateEnvContent", () => {
    it("generates basic env content with defaults", () => {
      const config: AppConfig = {};
      const content = generateEnvContent(config);

      expect(content).toContain("PROJECT_URL=http://localhost:3000");
      expect(content).toContain("NEXT_PUBLIC_SITE_URL=http://localhost:3000");
      expect(content).toContain("NEXT_PUBLIC_APP_NAME=eniem");
      expect(content).toContain("BETTER_AUTH_SECRET=mock-nanoid-secret-32chars-here");
      expect(content).toContain("DATABASE_URL=postgresql://eniem:eniem-dev-password@localhost:5432/eniem");
    });

    it("uses appName when provided", () => {
      const config: AppConfig = {
        project: { name: "my-app", appName: "My App" },
      };
      const content = generateEnvContent(config);

      expect(content).toContain("NEXT_PUBLIC_APP_NAME=My App");
    });

    it("falls back to project name when appName is not set", () => {
      const config: AppConfig = {
        project: { name: "my-app" },
      };
      const content = generateEnvContent(config);

      expect(content).toContain("NEXT_PUBLIC_APP_NAME=my-app");
    });

    it("uses provided auth secret", () => {
      const config: AppConfig = {
        authSecret: "custom-secret",
      };
      const content = generateEnvContent(config);

      expect(content).toContain("BETTER_AUTH_SECRET=custom-secret");
    });

    it("includes GitHub OAuth credentials", () => {
      const config: AppConfig = {
        oauth: {
          github: {
            clientId: "gh-client-id",
            clientSecret: "gh-client-secret",
          },
        },
      };
      const content = generateEnvContent(config);

      expect(content).toContain("GITHUB_CLIENT_ID=gh-client-id");
      expect(content).toContain("GITHUB_CLIENT_SECRET=gh-client-secret");
    });

    it("includes Twitter OAuth credentials", () => {
      const config: AppConfig = {
        oauth: {
          twitter: {
            clientId: "tw-client-id",
            clientSecret: "tw-client-secret",
          },
        },
      };
      const content = generateEnvContent(config);

      expect(content).toContain("TWITTER_CLIENT_ID=tw-client-id");
      expect(content).toContain("TWITTER_CLIENT_SECRET=tw-client-secret");
    });

    it("includes WalletConnect project ID", () => {
      const config: AppConfig = {
        web3: {
          enabled: true,
          walletConnectProjectId: "wc-project-id",
        },
      };
      const content = generateEnvContent(config);

      expect(content).toContain("NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=wc-project-id");
    });

    it("sets analytics provider to none when disabled", () => {
      const config: AppConfig = {
        analytics: {
          enabled: false,
        },
      };
      const content = generateEnvContent(config);

      expect(content).toContain("NEXT_PUBLIC_ANALYTICS_PROVIDER=none");
    });

    it("configures umami analytics", () => {
      const config: AppConfig = {
        analytics: {
          enabled: true,
          provider: "umami",
          siteId: "umami-site-id",
          hostUrl: "https://umami.example.com",
        },
      };
      const content = generateEnvContent(config);

      expect(content).toContain("NEXT_PUBLIC_ANALYTICS_PROVIDER=umami");
      expect(content).toContain("NEXT_PUBLIC_UMAMI_WEBSITE_ID=umami-site-id");
      expect(content).toContain("NEXT_PUBLIC_UMAMI_HOST=https://umami.example.com");
    });

    it("configures posthog analytics", () => {
      const config: AppConfig = {
        analytics: {
          enabled: true,
          provider: "posthog",
          siteId: "posthog-key",
          hostUrl: "https://posthog.example.com",
        },
      };
      const content = generateEnvContent(config);

      expect(content).toContain("NEXT_PUBLIC_ANALYTICS_PROVIDER=posthog");
      expect(content).toContain("NEXT_PUBLIC_POSTHOG_KEY=posthog-key");
      expect(content).toContain("NEXT_PUBLIC_POSTHOG_HOST=https://posthog.example.com");
    });

    it("uses default umami host when not provided", () => {
      const config: AppConfig = {
        analytics: {
          enabled: true,
          provider: "umami",
        },
      };
      const content = generateEnvContent(config);

      expect(content).toContain("NEXT_PUBLIC_UMAMI_HOST=https://cloud.umami.is");
    });

    it("uses default posthog host when not provided", () => {
      const config: AppConfig = {
        analytics: {
          enabled: true,
          provider: "posthog",
        },
      };
      const content = generateEnvContent(config);

      expect(content).toContain("NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com");
    });

    it("includes storage configuration", () => {
      const config: AppConfig = {
        storage: {
          enabled: true,
          endpoint: "https://nyc3.digitaloceanspaces.com",
          region: "nyc3",
          bucket: "my-bucket",
          accessKeyId: "access-key",
          secretAccessKey: "secret-key",
        },
      };
      const content = generateEnvContent(config);

      expect(content).toContain("DIGITALOCEAN_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com");
      expect(content).toContain("DIGITALOCEAN_SPACES_REGION=nyc3");
      expect(content).toContain("DIGITALOCEAN_SPACES_BUCKET=my-bucket");
      expect(content).toContain("DIGITALOCEAN_SPACES_ACCESS_KEY_ID=access-key");
      expect(content).toContain("DIGITALOCEAN_SPACES_SECRET_ACCESS_KEY=secret-key");
    });

    it("uses default storage values", () => {
      const config: AppConfig = {};
      const content = generateEnvContent(config);

      expect(content).toContain("DIGITALOCEAN_SPACES_ENDPOINT=https://ams3.digitaloceanspaces.com");
      expect(content).toContain("DIGITALOCEAN_SPACES_REGION=ams3");
    });

    it("includes payment configuration", () => {
      const config: AppConfig = {
        payment: {
          enabled: true,
          accessToken: "polar-token",
          server: "production",
          webhookSecret: "webhook-secret",
        },
      };
      const content = generateEnvContent(config);

      expect(content).toContain("POLAR_ACCESS_TOKEN=polar-token");
      expect(content).toContain("POLAR_SERVER=production");
      expect(content).toContain("POLAR_WEBHOOK_SECRET=webhook-secret");
    });

    it("uses default payment values", () => {
      const config: AppConfig = {};
      const content = generateEnvContent(config);

      expect(content).toContain("POLAR_ACCESS_TOKEN=polar_xx");
      expect(content).toContain("POLAR_SERVER=sandbox");
    });

    it("ends with trailing newline", () => {
      const config: AppConfig = {};
      const content = generateEnvContent(config);

      expect(content.endsWith("\n")).toBe(true);
    });

    it("defaults analytics to umami when enabled without provider", () => {
      const config: AppConfig = {
        analytics: {
          enabled: true,
        },
      };
      const content = generateEnvContent(config);

      expect(content).toContain("NEXT_PUBLIC_ANALYTICS_PROVIDER=umami");
    });
  });

  describe("writeEnvFile", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("writes env file successfully", async () => {
      vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

      const result = await writeEnvFile({
        config: { project: { name: "test" } },
        destination: "/project",
      });

      expect(result.success).toBe(true);
      expect(result.path).toBe(path.join("/project", ".env"));
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join("/project", ".env"),
        expect.any(String),
        "utf-8"
      );
    });

    it("returns error on write failure", async () => {
      vi.mocked(fs.writeFile).mockRejectedValueOnce(new Error("Permission denied"));

      const result = await writeEnvFile({
        config: {},
        destination: "/project",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to write .env file");
      expect(result.error).toContain("Permission denied");
    });

    it("handles non-Error exceptions", async () => {
      vi.mocked(fs.writeFile).mockRejectedValueOnce("Unknown error");

      const result = await writeEnvFile({
        config: {},
        destination: "/project",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown error occurred");
    });
  });
});
