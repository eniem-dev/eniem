import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { ReadyCommand } from "../ready.js";

// Mock fs/promises
vi.mock("fs/promises", () => ({
  access: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  constants: { R_OK: 4 },
}));

// Re-import to get mocked versions
import { access, readFile, writeFile } from "fs/promises";

const mockAccess = vi.mocked(access);
const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Types a value and presses Enter, with delays for React re-renders */
async function typeAndSubmit(
  stdin: { write: (data: string) => void },
  value: string,
) {
  stdin.write(value);
  await delay(50); // Let onChange → setState → re-render
  stdin.write("\r");
  await delay(50); // Let onSubmit → handleVarSubmit → re-render
}

describe("ReadyCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Preflight", () => {
    it("renders section header", () => {
      mockAccess.mockImplementation(() => new Promise(() => {}));

      const { lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );

      expect(lastFrame()).toContain("Production Environment Setup");
    });

    it("shows checking state initially", () => {
      mockAccess.mockImplementation(() => new Promise(() => {}));

      const { lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );

      expect(lastFrame()).toContain("Checking project files");
    });

    it("shows error when no .env.example exists", async () => {
      mockAccess.mockRejectedValue(new Error("ENOENT"));

      const { lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );

      await delay(50);

      expect(lastFrame()).toContain("No .env.example found");
    });

    it("shows info when existing .env is found", async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue("PROJECT_URL=https://example.com\n");

      const { lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );

      await delay(50);

      expect(lastFrame()).toContain(
        "Found .env — using existing values as defaults",
      );
    });

    it("shows info when no existing .env found", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));

      const { lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );

      await delay(50);

      expect(lastFrame()).toContain("No existing .env found");
    });
  });

  describe("Required Vars", () => {
    it("prompts for first required var after preflight", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));

      const { lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );

      await delay(50);

      expect(lastFrame()).toContain("Production URL");
      expect(lastFrame()).toContain("(1/8)");
    });

    it("shows notes for PROJECT_URL var", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));

      const { lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );

      await delay(50);

      expect(lastFrame()).toContain("NEXT_PUBLIC_SITE_URL");
      expect(lastFrame()).toContain("BETTER_AUTH_URL");
    });

    it("advances to next var after submission", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );

      await delay(50);
      expect(lastFrame()).toContain("(1/8)");

      await typeAndSubmit(stdin, "https://myapp.com");
      expect(lastFrame()).toContain("(2/8)");
      expect(lastFrame()).toContain("App name");
    });

    it("pre-fills values from existing .env", async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(
        "PROJECT_URL=https://myapp.com\nNEXT_PUBLIC_APP_NAME=MyApp\n",
      );

      const { lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );

      await delay(50);

      expect(lastFrame()).toContain("Production URL");
    });
  });

  describe("Groups Select", () => {
    it("shows MultiSelect after all required vars collected", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );

      await delay(50);

      const values = [
        "https://myapp.com",
        "MyApp",
        "postgres://localhost/myapp",
        "secret123",
        "polar_xxx",
        "whsec_xxx",
        "org_xxx",
        "re_xxx",
      ];

      for (const val of values) {
        await typeAndSubmit(stdin, val);
      }

      expect(lastFrame()).toContain("Optional feature groups");
    });

    it("displays all 7 optional groups", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );

      await delay(50);

      const values = [
        "https://myapp.com",
        "MyApp",
        "postgres://localhost/myapp",
        "secret123",
        "polar_xxx",
        "whsec_xxx",
        "org_xxx",
        "re_xxx",
      ];

      for (const val of values) {
        await typeAndSubmit(stdin, val);
      }

      const frame = lastFrame() ?? "";
      expect(frame).toContain("GitHub OAuth");
      expect(frame).toContain("Twitter/X OAuth");
      expect(frame).toContain("WalletConnect (Web3)");
      expect(frame).toContain("Analytics");
      expect(frame).toContain("File Uploads (DigitalOcean Spaces)");
      expect(frame).toContain("Email Branding");
      expect(frame).toContain("Site Config (Landing Mode)");
    });

    it("pre-checks groups with existing .env values", async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(
        "GITHUB_CLIENT_ID=abc123\nGITHUB_CLIENT_SECRET=secret\n",
      );

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );

      await delay(50);

      const values = [
        "https://myapp.com",
        "MyApp",
        "postgres://localhost/myapp",
        "secret123",
        "polar_xxx",
        "whsec_xxx",
        "org_xxx",
        "re_xxx",
      ];

      for (const val of values) {
        await typeAndSubmit(stdin, val);
      }

      const frame = lastFrame() ?? "";
      // GitHub OAuth should be pre-selected (◉), others not (○)
      const lines = frame.split("\n");
      const githubLine = lines.find((l: string) => l.includes("GitHub OAuth"));
      expect(githubLine).toContain("◉");
    });

    it("proceeds to output after confirming group selection", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));
      mockWriteFile.mockResolvedValue(undefined);

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );

      await delay(50);

      const values = [
        "https://myapp.com",
        "MyApp",
        "postgres://localhost/myapp",
        "secret123",
        "polar_xxx",
        "whsec_xxx",
        "org_xxx",
        "re_xxx",
      ];

      for (const val of values) {
        await typeAndSubmit(stdin, val);
      }

      // Confirm group selection (press Enter with defaults)
      stdin.write("\r");
      await delay(100);

      expect(lastFrame()).toContain("Production .env ready!");
    });
  });

  describe("Output", () => {
    /** Fill required vars and confirm groups to reach output step */
    async function fillRequiredVarsAndGroups(
      stdin: { write: (data: string) => void },
    ) {
      const values = [
        "https://myapp.com",
        "MyApp",
        "postgres://localhost/myapp",
        "secret123",
        "polar_xxx",
        "whsec_xxx",
        "org_xxx",
        "re_xxx",
      ];

      for (const val of values) {
        await typeAndSubmit(stdin, val);
      }

      // Confirm group selection (press Enter)
      stdin.write("\r");
      await delay(50);
    }

    it("writes .env.production after all vars collected", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));
      mockWriteFile.mockResolvedValue(undefined);

      const { stdin } = render(
        <ReadyCommand projectDir="/test/project" />,
      );

      await delay(50);
      await fillRequiredVarsAndGroups(stdin);
      await delay(100);

      expect(mockWriteFile).toHaveBeenCalledWith(
        "/test/project/.env.production",
        expect.stringContaining("PROJECT_URL=https://myapp.com"),
        "utf-8",
      );
    });

    it("shows summary after successful write", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));
      mockWriteFile.mockResolvedValue(undefined);

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );

      await delay(50);
      await fillRequiredVarsAndGroups(stdin);
      await delay(100);

      expect(lastFrame()).toContain("Production .env ready!");
    });

    it("shows auto-set values in summary", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));
      mockWriteFile.mockResolvedValue(undefined);

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );

      await delay(50);
      await fillRequiredVarsAndGroups(stdin);
      await delay(100);

      expect(lastFrame()).toContain("BETTER_AUTH_URL");
      expect(lastFrame()).toContain("https://myapp.com");
      expect(lastFrame()).toContain("POLAR_SERVER");
      expect(lastFrame()).toContain("production");
    });

    it("shows error when file write fails", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));
      mockWriteFile.mockRejectedValue(new Error("Permission denied"));

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );

      await delay(50);
      await fillRequiredVarsAndGroups(stdin);
      await delay(100);

      expect(lastFrame()).toContain("Failed to write .env.production");
      expect(lastFrame()).toContain("Permission denied");
    });
  });
});
