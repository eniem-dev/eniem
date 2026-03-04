import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { AiCommand } from "../ai.js";

// Mock ai-init utilities
vi.mock("../../lib/ai-init.js", () => ({
  checkEniExists: vi.fn(),
  sparseCloneBoilerplate: vi.fn(),
  copyAiFiles: vi.fn(),
  ensureSpecsFolder: vi.fn(),
  cleanupTempDir: vi.fn(),
  getCliFileInfo: vi.fn().mockResolvedValue({ cliId: "", cliName: "", folders: [], rootFiles: [], hasFiles: false }),
  removeCliConfig: vi.fn().mockResolvedValue(undefined),
}));

// Mock adapters
vi.mock("../../lib/adapters/index.js", () => ({
  SUPPORTED_CLIS: ["claude", "codex"],
  getAdapter: vi.fn((id: string) => ({
    name: id === "claude" ? "Claude Code" : "Codex",
    id,
    binary: id,
  })),
  checkBinary: vi.fn().mockResolvedValue(true),
}));

// Mock eni-config
vi.mock("../../lib/eni-config.js", () => ({
  readConfig: vi.fn().mockResolvedValue(null),
  writeConfig: vi.fn().mockResolvedValue(undefined),
}));

import {
  checkEniExists,
  sparseCloneBoilerplate,
  copyAiFiles,
  ensureSpecsFolder,
  cleanupTempDir,
} from "../../lib/ai-init.js";
import { readConfig, writeConfig } from "../../lib/eni-config.js";

const mockCheckEniExists = vi.mocked(checkEniExists);
const mockSparseCloneBoilerplate = vi.mocked(sparseCloneBoilerplate);
const mockCopyAiFiles = vi.mocked(copyAiFiles);
const mockEnsureSpecsFolder = vi.mocked(ensureSpecsFolder);
const mockCleanupTempDir = vi.mocked(cleanupTempDir);
const mockReadConfig = vi.mocked(readConfig);
const mockWriteConfig = vi.mocked(writeConfig);

describe("AiCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCleanupTempDir.mockResolvedValue(undefined);
    mockReadConfig.mockResolvedValue(null);
    mockWriteConfig.mockResolvedValue(undefined);
  });

  describe("Initial State", () => {
    it("renders section header", () => {
      mockCheckEniExists.mockImplementation(() => new Promise(() => {}));

      const { lastFrame } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      expect(lastFrame()).toContain("AI Workflow Setup");
    });

    it("shows checking state initially", () => {
      mockCheckEniExists.mockImplementation(() => new Promise(() => {}));

      const { lastFrame } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      expect(lastFrame()).toContain("Checking");
    });
  });

  describe("When .eni does not exist", () => {
    it("proceeds directly to cloning without confirmation", async () => {
      mockCheckEniExists.mockResolvedValue(false);
      mockSparseCloneBoilerplate.mockImplementation(
        () => new Promise(() => {})
      );

      const { lastFrame } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(lastFrame()).toContain("Fetching");
      expect(lastFrame()).not.toContain("already exists");
    });
  });

  describe("When .eni exists", () => {
    it("asks for confirmation when .eni exists", async () => {
      mockCheckEniExists.mockResolvedValue(true);

      const { lastFrame } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(lastFrame()).toContain(".eni folder already exists");
      expect(lastFrame()).toContain("Update AI workflow files?");
    });

    it("skips confirmation with --force flag", async () => {
      mockCheckEniExists.mockResolvedValue(true);
      mockSparseCloneBoilerplate.mockImplementation(
        () => new Promise(() => {})
      );

      const { lastFrame } = render(
        <AiCommand forceFlag={true} targetDir="/test/project" gitHost="github.com" />
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(lastFrame()).toContain("Fetching");
      expect(lastFrame()).not.toContain("already exists");
    });
  });

  describe("Successful Initialization", () => {
    /** Helper: set up mocks for a successful file copy and advance through config selection */
    function setupSuccessMocks({
      eniExists = false,
      addedFiles = [".eni/PROMPT_plan.md"],
      skippedFiles = [] as string[],
      specsCreated = false,
    } = {}) {
      mockCheckEniExists.mockResolvedValue(eniExists);
      mockSparseCloneBoilerplate.mockResolvedValue({
        success: true,
        tempDir: "/tmp/test",
      });
      mockCopyAiFiles.mockResolvedValue({
        success: true,
        report: { addedFiles, skippedFiles },
      });
      mockEnsureSpecsFolder.mockResolvedValue({
        success: true,
        created: specsCreated,
      });
    }

    /** Advance through select_clis → plan → build → verbose → narration to reach complete */
    async function advanceThroughConfigSteps(stdin: { write: (s: string) => void }) {
      // Wait for adapters to load and CLI multi-select to render
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Submit CLI multi-select (Enter — pre-selected installed CLIs)
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Select first plan CLI (Enter)
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Select first build CLI (Enter)
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Confirm verbose (Enter accepts default=No)
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Select first narration option — Concise (Enter)
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    it("shows success message with copied files", async () => {
      setupSuccessMocks({
        addedFiles: [".eni/PROMPT_plan.md", ".eni/PROMPT_build.md", ".claude/settings.local.json"],
        specsCreated: true,
      });

      const { lastFrame, stdin } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await advanceThroughConfigSteps(stdin);

      expect(lastFrame()).toContain("AI workflow initialized.");
      expect(lastFrame()).toContain("Added .eni/PROMPT_plan.md");
      expect(lastFrame()).toContain("Added .eni/PROMPT_build.md");
      expect(lastFrame()).toContain("Added .claude/settings.local.json");
      expect(lastFrame()).toContain("Added specs/.gitkeep");
    });

    it("shows update message when updating existing workflow", async () => {
      setupSuccessMocks({ eniExists: true });

      const { lastFrame, stdin } = render(
        <AiCommand forceFlag={true} targetDir="/test/project" gitHost="github.com" />
      );

      await advanceThroughConfigSteps(stdin);

      expect(lastFrame()).toContain("AI workflow files updated!");
    });

    it("shows functional-spec-interview hint on success", async () => {
      setupSuccessMocks();

      const { lastFrame, stdin } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await advanceThroughConfigSteps(stdin);

      expect(lastFrame()).toContain("/functional-spec-interview");
    });

    it("shows hint about eni plan on success", async () => {
      setupSuccessMocks();

      const { lastFrame, stdin } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await advanceThroughConfigSteps(stdin);

      expect(lastFrame()).toContain("eni plan");
    });

    it("shows hint about eni build on success", async () => {
      setupSuccessMocks();

      const { lastFrame, stdin } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await advanceThroughConfigSteps(stdin);

      expect(lastFrame()).toContain("eni build");
    });

    it("shows config saved message on success", async () => {
      setupSuccessMocks();

      const { lastFrame, stdin } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await advanceThroughConfigSteps(stdin);

      expect(lastFrame()).toContain("Config saved to .eni/config.json");
    });

    it("shows CLI multi-select after file copy", async () => {
      setupSuccessMocks();

      const { lastFrame } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Which CLIs do you want to configure?");
    });

    it("does not show specs created message when specs already existed", async () => {
      setupSuccessMocks({ specsCreated: false });

      const { lastFrame, stdin } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await advanceThroughConfigSteps(stdin);

      expect(lastFrame()).not.toContain("Created specs/");
    });

    it("renders narration selector after verbose step", async () => {
      setupSuccessMocks();

      const { lastFrame, stdin } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      // Advance through select_clis → plan → build → verbose
      await new Promise((resolve) => setTimeout(resolve, 100));
      stdin.write("\r"); // submit CLI multi-select
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write("\r"); // plan
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write("\r"); // build
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write("\r"); // verbose
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(lastFrame()).toContain("Narration style:");
      expect(lastFrame()).toContain("Concise");
      expect(lastFrame()).toContain("Explicit");
    });

    it("saves narration in writeConfig call", async () => {
      setupSuccessMocks();

      const { stdin } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await advanceThroughConfigSteps(stdin);

      expect(mockWriteConfig).toHaveBeenCalledWith(
        "/test/project",
        expect.objectContaining({ narration: "concise" }),
      );
    });

    it("pre-selects existing config narration value", async () => {
      setupSuccessMocks();
      mockReadConfig.mockResolvedValue({ plan: "claude", build: "claude", verbose: false, narration: "explicit" });

      const { lastFrame, stdin } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      // Advance through select_clis → plan → build → verbose
      await new Promise((resolve) => setTimeout(resolve, 100));
      stdin.write("\r"); // submit CLI multi-select
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write("\r"); // plan
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write("\r"); // build
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write("\r"); // verbose
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Narration selector should be visible
      expect(lastFrame()).toContain("Narration style:");
    });

    it("shows narration summary on completion", async () => {
      setupSuccessMocks();

      const { lastFrame, stdin } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await advanceThroughConfigSteps(stdin);

      expect(lastFrame()).toContain("Narration: concise");
    });
  });

  describe("CLI Multi-Select", () => {
    function setupSuccessToCliSelect({
      eniExists = false,
    } = {}) {
      mockCheckEniExists.mockResolvedValue(eniExists);
      mockSparseCloneBoilerplate.mockResolvedValue({
        success: true,
        tempDir: "/tmp/test",
      });
      mockCopyAiFiles.mockResolvedValue({
        success: true,
        report: { addedFiles: [".eni/PROMPT_plan.md"], skippedFiles: [] },
      });
      mockEnsureSpecsFolder.mockResolvedValue({
        success: true,
        created: false,
      });
    }

    it("shows install status for each CLI option", async () => {
      setupSuccessToCliSelect();
      // Mock one CLI as not installed
      const { checkBinary } = await import("../../lib/adapters/index.js");
      const mockCheckBinary = vi.mocked(checkBinary);
      mockCheckBinary.mockImplementation(async (name: string) => name !== "codex");

      const { lastFrame } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Claude Code (installed)");
      expect(lastFrame()).toContain("Codex (not found)");

      // Reset mock
      mockCheckBinary.mockResolvedValue(true);
    });

    it("pre-selects CLIs from existing config on re-run", async () => {
      setupSuccessToCliSelect();
      mockReadConfig.mockResolvedValue({ plan: "claude", build: "claude", clis: ["codex"], verbose: false, narration: "concise" });

      const { lastFrame } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should show the multi-select with existing config clis pre-selected
      expect(lastFrame()).toContain("Which CLIs do you want to configure?");
      expect(lastFrame()).toContain("Selected: 1 item");
    });

    it("saves selected CLIs to config", async () => {
      setupSuccessToCliSelect();

      const { stdin } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      // Wait for CLI multi-select
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Submit with pre-selected (both installed)
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));
      // plan CLI
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));
      // build CLI
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));
      // verbose
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));
      // narration
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockWriteConfig).toHaveBeenCalledWith(
        "/test/project",
        expect.objectContaining({ clis: ["claude", "codex"] }),
      );
    });

    it("shows warnings for selected CLIs that are not installed", async () => {
      setupSuccessToCliSelect();
      const { checkBinary } = await import("../../lib/adapters/index.js");
      const mockCheckBinary = vi.mocked(checkBinary);
      mockCheckBinary.mockImplementation(async (name: string) => name !== "codex");

      const { lastFrame, stdin } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Toggle codex on (it's not pre-selected since not installed), then submit
      // Navigate to Codex (second item) and toggle it
      stdin.write("j"); // move down to Codex
      await new Promise((resolve) => setTimeout(resolve, 20));
      stdin.write(" "); // toggle Codex on
      await new Promise((resolve) => setTimeout(resolve, 20));
      stdin.write("\r"); // submit
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(lastFrame()).toContain("binary not found");

      // Reset mock
      mockCheckBinary.mockResolvedValue(true);
    });

    it("allows empty CLI selection", async () => {
      setupSuccessToCliSelect();

      const { lastFrame, stdin } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Deselect all pre-selected CLIs
      stdin.write(" "); // toggle off first (claude)
      await new Promise((resolve) => setTimeout(resolve, 20));
      stdin.write("j"); // move to second
      await new Promise((resolve) => setTimeout(resolve, 20));
      stdin.write(" "); // toggle off second (codex)
      await new Promise((resolve) => setTimeout(resolve, 20));
      stdin.write("\r"); // submit empty
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should proceed to plan CLI selection (no crash)
      expect(lastFrame()).toContain("Default CLI for plan:");
    });
  });

  describe("Error Handling", () => {
    it("shows error when clone fails", async () => {
      mockCheckEniExists.mockResolvedValue(false);
      mockSparseCloneBoilerplate.mockResolvedValue({
        success: false,
        tempDir: "",
        error: "Network error",
      });

      const { lastFrame } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Network error");
    });

    it("shows error when copy fails", async () => {
      mockCheckEniExists.mockResolvedValue(false);
      mockSparseCloneBoilerplate.mockResolvedValue({
        success: true,
        tempDir: "/tmp/test",
      });
      mockCopyAiFiles.mockResolvedValue({
        success: false,
        report: { addedFiles: [], skippedFiles: [] },
        error: "Permission denied",
      });

      const { lastFrame } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Permission denied");
    });

    it("shows error when specs folder creation fails", async () => {
      mockCheckEniExists.mockResolvedValue(false);
      mockSparseCloneBoilerplate.mockResolvedValue({
        success: true,
        tempDir: "/tmp/test",
      });
      mockCopyAiFiles.mockResolvedValue({
        success: true,
        report: { addedFiles: [".eni/PROMPT_plan.md"], skippedFiles: [] },
      });
      mockEnsureSpecsFolder.mockResolvedValue({
        success: false,
        created: false,
        error: "Cannot create directory",
      });

      const { lastFrame } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Cannot create directory");
    });

    it("cleans up temp directory on error", async () => {
      mockCheckEniExists.mockResolvedValue(false);
      mockSparseCloneBoilerplate.mockResolvedValue({
        success: true,
        tempDir: "/tmp/test-cleanup",
      });
      mockCopyAiFiles.mockResolvedValue({
        success: false,
        report: { addedFiles: [], skippedFiles: [] },
        error: "Copy failed",
      });

      render(<AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockCleanupTempDir).toHaveBeenCalledWith("/tmp/test-cleanup");
    });
  });
});
