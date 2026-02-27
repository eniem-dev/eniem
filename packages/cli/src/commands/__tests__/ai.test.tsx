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
      copiedFiles = [".eni/PROMPT_plan.md"],
      specsCreated = false,
    } = {}) {
      mockCheckEniExists.mockResolvedValue(eniExists);
      mockSparseCloneBoilerplate.mockResolvedValue({
        success: true,
        tempDir: "/tmp/test",
      });
      mockCopyAiFiles.mockResolvedValue({
        success: true,
        copiedFiles,
      });
      mockEnsureSpecsFolder.mockResolvedValue({
        success: true,
        created: specsCreated,
      });
    }

    /** Advance through plan → build → verbose selection to reach complete */
    async function advanceThroughConfigSteps(stdin: { write: (s: string) => void }) {
      // Wait for adapters to load and plan select to render
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Select first plan CLI (Enter)
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Select first build CLI (Enter)
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Confirm verbose (Enter accepts default=No)
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    it("shows success message with copied files", async () => {
      setupSuccessMocks({
        copiedFiles: [".eni/PROMPT_plan.md", ".eni/PROMPT_build.md", ".claude/settings.local.json"],
        specsCreated: true,
      });

      const { lastFrame, stdin } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await advanceThroughConfigSteps(stdin);

      expect(lastFrame()).toContain("AI workflow initialized.");
      expect(lastFrame()).toContain("Copied files:");
      expect(lastFrame()).toContain(".eni/PROMPT_plan.md");
      expect(lastFrame()).toContain(".eni/PROMPT_build.md");
      expect(lastFrame()).toContain(".claude/settings.local.json");
      expect(lastFrame()).toContain("specs/.gitkeep");
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

    it("shows CLI selection prompts after file copy", async () => {
      setupSuccessMocks();

      const { lastFrame } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Default CLI for plan:");
    });

    it("does not show specs created message when specs already existed", async () => {
      setupSuccessMocks({ specsCreated: false });

      const { lastFrame, stdin } = render(
        <AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />
      );

      await advanceThroughConfigSteps(stdin);

      expect(lastFrame()).not.toContain("Created specs/");
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
        copiedFiles: [],
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
        copiedFiles: [".eni/PROMPT_plan.md"],
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
        copiedFiles: [],
        error: "Copy failed",
      });

      render(<AiCommand forceFlag={false} targetDir="/test/project" gitHost="github.com" />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockCleanupTempDir).toHaveBeenCalledWith("/tmp/test-cleanup");
    });
  });
});
