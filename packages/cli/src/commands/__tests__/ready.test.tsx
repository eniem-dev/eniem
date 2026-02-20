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

// Mock fs (existsSync for overwrite check)
vi.mock("fs", () => ({
  existsSync: vi.fn().mockReturnValue(false),
}));

// Mock clipboardy
vi.mock("clipboardy", () => ({
  default: {
    write: vi.fn().mockResolvedValue(undefined),
  },
}));

// Re-import to get mocked versions
import { access, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import clipboard from "clipboardy";

const mockAccess = vi.mocked(access);
const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);
const mockExistsSync = vi.mocked(existsSync);
const mockClipboardWrite = vi.mocked(clipboard.write);

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
    mockExistsSync.mockReturnValue(false);
    mockClipboardWrite.mockResolvedValue(undefined);
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

    it("shows output choice after confirming group selection", async () => {
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

      // Confirm group selection (press Enter with defaults)
      stdin.write("\r");
      await delay(100);

      expect(lastFrame()).toContain("Where should the production env be saved?");
    });
  });

  /** Fill all 8 required vars to reach groups_select step */
  async function fillRequiredVars(stdin: { write: (data: string) => void }) {
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
  }

  /** Navigate MultiSelect: move down N times and toggle space (with delays for ink) */
  async function selectGroupAtIndex(
    stdin: { write: (data: string) => void },
    index: number,
  ) {
    for (let i = 0; i < index; i++) {
      stdin.write("j"); // down (MultiSelect supports j/k navigation)
      await delay(20);
    }
    stdin.write(" "); // space to toggle
    await delay(20);
  }

  /** Select file output in output_choice step */
  async function selectFileOutput(stdin: { write: (data: string) => void }) {
    stdin.write("\r"); // Select first option (.env.production file)
    await delay(50);
  }

  /** Select clipboard output in output_choice step */
  async function selectClipboardOutput(
    stdin: { write: (data: string) => void },
  ) {
    stdin.write("\x1B[B"); // Down arrow to "Copy to clipboard"
    await delay(30);
    stdin.write("\r");
    await delay(50);
  }

  describe("Analytics Provider", () => {
    it("shows analytics provider select when Analytics group is checked", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await fillRequiredVars(stdin);

      // Select Analytics (index 3 in groups list)
      await selectGroupAtIndex(stdin, 3);
      stdin.write("\r"); // confirm groups
      await delay(50);

      expect(lastFrame()).toContain("Which analytics provider?");
    });

    it("does not show analytics select when Analytics is not checked", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await fillRequiredVars(stdin);

      // Confirm with no groups selected
      stdin.write("\r");
      await delay(100);

      expect(lastFrame()).not.toContain("Which analytics provider?");
      expect(lastFrame()).toContain("Where should the production env be saved?");
    });

    it("shows Umami vars after selecting Umami provider", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await fillRequiredVars(stdin);

      // Select Analytics group
      await selectGroupAtIndex(stdin, 3);
      stdin.write("\r"); // confirm groups
      await delay(50);

      // Select Umami (first option in ink-select-input, just press Enter)
      stdin.write("\r");
      await delay(50);

      expect(lastFrame()).toContain("Umami host URL");
    });

    it("shows PostHog vars after selecting PostHog provider", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await fillRequiredVars(stdin);

      // Select Analytics group
      await selectGroupAtIndex(stdin, 3);
      stdin.write("\r"); // confirm groups
      await delay(50);

      // Select PostHog (second option — navigate down then enter)
      stdin.write("\x1B[B"); // down arrow for ink-select-input
      await delay(30);
      stdin.write("\r");
      await delay(50);

      expect(lastFrame()).toContain("PostHog host URL");
    });

    it("skips analytics vars when None selected", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await fillRequiredVars(stdin);

      // Select only Analytics group
      await selectGroupAtIndex(stdin, 3);
      stdin.write("\r"); // confirm groups
      await delay(50);

      // Select None (third option — down, down, enter)
      stdin.write("\x1B[B");
      await delay(30);
      stdin.write("\x1B[B");
      await delay(30);
      stdin.write("\r");
      await delay(100);

      // Should skip straight to output choice (no vars to prompt)
      expect(lastFrame()).toContain("Where should the production env be saved?");
    });

    it("puts existing provider first in options list", async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(
        "NEXT_PUBLIC_ANALYTICS_PROVIDER=posthog\nNEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com\n",
      );

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await fillRequiredVars(stdin);

      // Analytics is already pre-checked from existing env (NEXT_PUBLIC_POSTHOG_HOST)
      // Just confirm the groups selection to proceed to analytics_provider
      stdin.write("\r");
      await delay(50);

      const frame = lastFrame() ?? "";
      // PostHog should appear first because it's in existing env
      const lines = frame.split("\n");
      const posthogLine = lines.findIndex((l: string) =>
        l.includes("PostHog"),
      );
      const umamiLine = lines.findIndex((l: string) => l.includes("Umami"));
      expect(posthogLine).toBeGreaterThan(-1);
      expect(posthogLine).toBeLessThan(umamiLine);
    });
  });

  describe("Group Vars", () => {
    it("prompts for group vars after selecting a non-analytics group", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await fillRequiredVars(stdin);

      // Select GitHub OAuth (index 0 — cursor starts here, just toggle)
      await selectGroupAtIndex(stdin, 0);
      stdin.write("\r"); // confirm groups
      await delay(50);

      expect(lastFrame()).toContain("GitHub OAuth");
      expect(lastFrame()).toContain("GitHub OAuth client ID");
      expect(lastFrame()).toContain("(1/2)");
    });

    it("advances through group vars sequentially", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await fillRequiredVars(stdin);

      // Select GitHub OAuth (index 0)
      await selectGroupAtIndex(stdin, 0);
      stdin.write("\r"); // confirm groups
      await delay(50);

      expect(lastFrame()).toContain("(1/2)");
      await typeAndSubmit(stdin, "gh_client_id");

      expect(lastFrame()).toContain("(2/2)");
      expect(lastFrame()).toContain("GitHub OAuth client secret");
    });

    it("shows output choice after all group vars entered", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await fillRequiredVars(stdin);

      // Select GitHub OAuth (index 0)
      await selectGroupAtIndex(stdin, 0);
      stdin.write("\r"); // confirm groups
      await delay(50);

      // Fill both GitHub OAuth vars
      await typeAndSubmit(stdin, "gh_client_id");
      await typeAndSubmit(stdin, "gh_client_secret");
      await delay(100);

      expect(lastFrame()).toContain("Where should the production env be saved?");
    });

    it("pre-fills group vars from existing .env", async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(
        "GITHUB_CLIENT_ID=existing_id\nGITHUB_CLIENT_SECRET=existing_secret\n",
      );

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await fillRequiredVars(stdin);

      // GitHub OAuth is already pre-checked from existing env
      // Just confirm the groups selection (GitHub OAuth will be selected)
      stdin.write("\r");
      await delay(50);

      // The first group var should show with pre-filled value visible
      expect(lastFrame()).toContain("GitHub OAuth client ID");
    });

    it("collects vars from multiple selected groups", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await fillRequiredVars(stdin);

      // Select GitHub OAuth (index 0) and WalletConnect (index 2)
      await selectGroupAtIndex(stdin, 0); // GitHub — toggle at index 0
      // Navigate to WalletConnect (index 2) and toggle
      stdin.write("j"); // move to Twitter (index 1)
      await delay(20);
      stdin.write("j"); // move to WalletConnect (index 2)
      await delay(20);
      stdin.write(" "); // toggle WalletConnect
      await delay(20);
      stdin.write("\r"); // confirm groups
      await delay(50);

      // Should show GitHub vars first (2 vars) + WalletConnect vars (1 var) = 3 total
      expect(lastFrame()).toContain("(1/3)");
      expect(lastFrame()).toContain("GitHub OAuth");
    });
  });

  describe("Output Choice", () => {
    /** Fill required vars, confirm groups, reach output_choice */
    async function reachOutputChoice(
      stdin: { write: (data: string) => void },
    ) {
      await fillRequiredVars(stdin);
      stdin.write("\r"); // Confirm group selection
      await delay(50);
    }

    it("shows two output options", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await reachOutputChoice(stdin);

      const frame = lastFrame() ?? "";
      expect(frame).toContain(".env.production file");
      expect(frame).toContain("Copy to clipboard");
    });

    it("writes file when file option selected", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));
      mockWriteFile.mockResolvedValue(undefined);

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await reachOutputChoice(stdin);
      await selectFileOutput(stdin);
      await delay(100);

      expect(mockWriteFile).toHaveBeenCalledWith(
        "/test/project/.env.production",
        expect.stringContaining("PROJECT_URL=https://myapp.com"),
        "utf-8",
      );
      expect(lastFrame()).toContain("Production .env ready!");
      expect(lastFrame()).toContain(".env.production");
    });

    it("copies to clipboard when clipboard option selected", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await reachOutputChoice(stdin);
      await selectClipboardOutput(stdin);
      await delay(100);

      expect(mockClipboardWrite).toHaveBeenCalledWith(
        expect.stringContaining("PROJECT_URL=https://myapp.com"),
      );
      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(lastFrame()).toContain("Production .env ready!");
      expect(lastFrame()).toContain("Copied to clipboard");
    });

    it("falls back to stdout when clipboard copy fails", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));
      mockClipboardWrite.mockRejectedValue(new Error("No clipboard"));

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await reachOutputChoice(stdin);
      await selectClipboardOutput(stdin);
      await delay(100);

      const frame = lastFrame() ?? "";
      expect(frame).toContain("Failed to copy to clipboard");
      expect(frame).toContain("Outputting to stdout instead");
      expect(frame).toContain("PROJECT_URL=https://myapp.com");
    });
  });

  describe("Overwrite Confirm", () => {
    /** Fill required vars, confirm groups, reach output_choice */
    async function reachOutputChoice(
      stdin: { write: (data: string) => void },
    ) {
      await fillRequiredVars(stdin);
      stdin.write("\r"); // Confirm group selection
      await delay(50);
    }

    it("shows overwrite confirmation when .env.production exists", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));
      mockExistsSync.mockReturnValue(true);

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await reachOutputChoice(stdin);
      await selectFileOutput(stdin);
      await delay(50);

      expect(lastFrame()).toContain("Found existing .env.production. Overwrite?");
    });

    it("writes file when overwrite confirmed", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));
      mockExistsSync.mockReturnValue(true);
      mockWriteFile.mockResolvedValue(undefined);

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await reachOutputChoice(stdin);
      await selectFileOutput(stdin);
      await delay(50);

      // Confirm overwrite (press 'y')
      stdin.write("y");
      await delay(100);

      expect(mockWriteFile).toHaveBeenCalledWith(
        "/test/project/.env.production",
        expect.stringContaining("PROJECT_URL=https://myapp.com"),
        "utf-8",
      );
      expect(lastFrame()).toContain("Production .env ready!");
    });

    it("aborts when overwrite declined", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));
      mockExistsSync.mockReturnValue(true);

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await reachOutputChoice(stdin);
      await selectFileOutput(stdin);
      await delay(50);

      // Decline overwrite (press 'n')
      stdin.write("n");
      await delay(100);

      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(lastFrame()).toContain("Aborted. No changes made.");
    });

    it("defaults to No on overwrite confirmation", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));
      mockExistsSync.mockReturnValue(true);

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await reachOutputChoice(stdin);
      await selectFileOutput(stdin);
      await delay(50);

      // Press Enter without choosing (default is No)
      stdin.write("\r");
      await delay(100);

      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(lastFrame()).toContain("Aborted. No changes made.");
    });
  });

  describe("Output", () => {
    /** Fill required vars, confirm groups, select file output */
    async function fillRequiredVarsAndGroups(
      stdin: { write: (data: string) => void },
    ) {
      await fillRequiredVars(stdin);
      stdin.write("\r"); // Confirm group selection
      await delay(50);
      await selectFileOutput(stdin); // Select file output
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

  describe("Summary Display", () => {
    it("shows Core, Payments, Email always in Configured section", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));
      mockWriteFile.mockResolvedValue(undefined);

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await fillRequiredVars(stdin);

      // Confirm with no optional groups selected
      stdin.write("\r");
      await delay(50);
      await selectFileOutput(stdin);
      await delay(100);

      const frame = lastFrame() ?? "";
      expect(frame).toContain("Configured:");
      expect(frame).toContain("Core (URL, app name, database, auth)");
      expect(frame).toContain("Payments (Polar)");
      expect(frame).toContain("Email (Resend)");
    });

    it("shows selected optional groups in Configured section", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));
      mockWriteFile.mockResolvedValue(undefined);

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await fillRequiredVars(stdin);

      // Select GitHub OAuth (index 0)
      await selectGroupAtIndex(stdin, 0);
      stdin.write("\r"); // confirm groups
      await delay(50);

      // Fill GitHub OAuth vars
      await typeAndSubmit(stdin, "gh_client_id");
      await typeAndSubmit(stdin, "gh_client_secret");
      await delay(50);

      await selectFileOutput(stdin);
      await delay(100);

      const frame = lastFrame() ?? "";
      expect(frame).toContain("GitHub OAuth");
    });

    it("shows skipped optional groups in Skipped section", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));
      mockWriteFile.mockResolvedValue(undefined);

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await fillRequiredVars(stdin);

      // Confirm with no optional groups selected → all skipped
      stdin.write("\r");
      await delay(50);
      await selectFileOutput(stdin);
      await delay(100);

      const frame = lastFrame() ?? "";
      expect(frame).toContain("Skipped:");
      expect(frame).toContain("GitHub OAuth");
      expect(frame).toContain("Twitter/X OAuth");
      expect(frame).toContain("Analytics");
    });

    it("shows analytics provider name in Configured when selected", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));
      mockWriteFile.mockResolvedValue(undefined);

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await fillRequiredVars(stdin);

      // Select Analytics (index 3)
      await selectGroupAtIndex(stdin, 3);
      stdin.write("\r"); // confirm groups
      await delay(50);

      // Select Umami (first option)
      stdin.write("\r");
      await delay(50);

      // Fill Umami vars
      await typeAndSubmit(stdin, "https://umami.example.com");
      await typeAndSubmit(stdin, "website-id-123");
      await delay(50);

      await selectFileOutput(stdin);
      await delay(100);

      const frame = lastFrame() ?? "";
      expect(frame).toContain("Analytics (Umami)");
    });

    it("shows auto-set values with actual entered PROJECT_URL", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));
      mockWriteFile.mockResolvedValue(undefined);

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await fillRequiredVars(stdin);

      stdin.write("\r"); // confirm groups
      await delay(50);
      await selectFileOutput(stdin);
      await delay(100);

      const frame = lastFrame() ?? "";
      expect(frame).toContain("Auto-set:");
      expect(frame).toContain("POLAR_SERVER = production");
      expect(frame).toContain("BETTER_AUTH_URL = https://myapp.com");
      expect(frame).toContain("NEXT_PUBLIC_SITE_URL = https://myapp.com");
    });

  });

  describe("Edge Cases", () => {
    it("sets exitCode 1 when no .env.example found", async () => {
      const originalExitCode = process.exitCode;
      mockAccess.mockRejectedValue(new Error("ENOENT"));

      const { lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );

      await delay(50);

      expect(lastFrame()).toContain("No .env.example found");
      expect(process.exitCode).toBe(1);

      // Clean up
      process.exitCode = originalExitCode;
    });

    it("accepts empty values for required vars", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );

      await delay(50);
      expect(lastFrame()).toContain("(1/8)");

      // Submit empty value — should advance, not show error
      stdin.write("\r");
      await delay(50);

      expect(lastFrame()).toContain("(2/8)");
      expect(lastFrame()).not.toContain("is required");
    });

    it("produces valid output when all optional groups skipped", async () => {
      mockAccess
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ENOENT"));
      mockWriteFile.mockResolvedValue(undefined);

      const { stdin, lastFrame } = render(
        <ReadyCommand projectDir="/test/project" />,
      );
      await delay(50);
      await fillRequiredVars(stdin);

      // Skip all groups (press Enter without selecting any)
      stdin.write("\r");
      await delay(50);

      // Select file output
      stdin.write("\r");
      await delay(100);

      // Should have written a valid file with only required + auto-set vars
      expect(mockWriteFile).toHaveBeenCalledWith(
        "/test/project/.env.production",
        expect.stringContaining("PROJECT_URL=https://myapp.com"),
        "utf-8",
      );

      const frame = lastFrame() ?? "";
      expect(frame).toContain("Production .env ready!");
      expect(frame).toContain("Skipped:");
      expect(frame).toContain("GitHub OAuth");
    });
  });
});
