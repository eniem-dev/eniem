import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

vi.mock("../../lib/ai-init.js", () => ({
  checkEniExists: vi.fn(),
  sparseCloneBoilerplate: vi.fn(),
  copyAiFiles: vi.fn(),
  copyClaudeFilesOnly: vi.fn(),
  ensureSpecsFolder: vi.fn(),
  cleanupTempDir: vi.fn(),
  detectLegacyFiles: vi.fn(),
  removeLegacyFiles: vi.fn(),
  initBeads: vi.fn(),
}));

import {
  checkEniExists,
  sparseCloneBoilerplate,
  copyAiFiles,
  copyClaudeFilesOnly,
  ensureSpecsFolder,
  cleanupTempDir,
  detectLegacyFiles,
  removeLegacyFiles,
  initBeads,
} from "../../lib/ai-init.js";
import { runAiSetup } from "../ai-setup.js";

// Capture console.log output
let logOutput: string[];
const originalLog = console.log;

// Mock process.exit
const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
  throw new Error("process.exit called");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any);

describe("ai-setup", () => {
  let tempDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    logOutput = [];
    console.log = (...args: unknown[]) => {
      logOutput.push(args.map(String).join(" "));
    };
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ai-setup-test-"));

    // Default mocks for happy path
    vi.mocked(detectLegacyFiles).mockResolvedValue([]);
    vi.mocked(removeLegacyFiles).mockResolvedValue([]);
    vi.mocked(cleanupTempDir).mockResolvedValue();
  });

  afterEach(async () => {
    console.log = originalLog;
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("full setup mode", () => {
    it("creates all files and initializes beads", async () => {
      vi.mocked(checkEniExists).mockResolvedValue(false);
      vi.mocked(sparseCloneBoilerplate).mockResolvedValue({
        success: true,
        tempDir: "/tmp/clone",
      });
      vi.mocked(copyAiFiles).mockResolvedValue({
        success: true,
        copiedFiles: [".eni/PROMPT_plan.md", ".claude/settings.json"],
      });
      vi.mocked(ensureSpecsFolder).mockResolvedValue({
        success: true,
        created: true,
      });
      vi.mocked(initBeads).mockResolvedValue({ status: "initialized" });

      await runAiSetup({
        targetDir: tempDir,
        gitHost: "github.com",
        force: false,
        update: false,
      });

      expect(sparseCloneBoilerplate).toHaveBeenCalledWith("github.com");
      expect(copyAiFiles).toHaveBeenCalledWith("/tmp/clone", tempDir);
      expect(ensureSpecsFolder).toHaveBeenCalledWith(tempDir);
      expect(initBeads).toHaveBeenCalledWith(tempDir);
      expect(cleanupTempDir).toHaveBeenCalledWith("/tmp/clone");

      const output = logOutput.join("\n");
      expect(output).toContain("✓");
      expect(output).toContain(".eni/PROMPT_plan.md");
      expect(output).toContain(".claude/settings.json");
      expect(output).toContain("specs/ (created)");
      expect(output).toContain("bd onboard");
      expect(output).toContain("Setup complete");
    });

    it("warns when bd is not installed but completes setup", async () => {
      vi.mocked(checkEniExists).mockResolvedValue(false);
      vi.mocked(sparseCloneBoilerplate).mockResolvedValue({
        success: true,
        tempDir: "/tmp/clone",
      });
      vi.mocked(copyAiFiles).mockResolvedValue({
        success: true,
        copiedFiles: [".eni/PROMPT_plan.md"],
      });
      vi.mocked(ensureSpecsFolder).mockResolvedValue({
        success: true,
        created: false,
      });
      vi.mocked(initBeads).mockResolvedValue({ status: "no-bd" });

      await runAiSetup({
        targetDir: tempDir,
        gitHost: "github.com",
        force: false,
        update: false,
      });

      const output = logOutput.join("\n");
      expect(output).toContain("bd (beads) not found");
      expect(output).toContain("Setup complete (without beads)");
    });

    it("exits with error when clone fails", async () => {
      vi.mocked(checkEniExists).mockResolvedValue(false);
      vi.mocked(sparseCloneBoilerplate).mockResolvedValue({
        success: false,
        tempDir: "",
        error: "Network error",
      });

      await expect(
        runAiSetup({
          targetDir: tempDir,
          gitHost: "github.com",
          force: false,
          update: false,
        }),
      ).rejects.toThrow("process.exit called");

      expect(mockExit).toHaveBeenCalledWith(1);
      const output = logOutput.join("\n");
      expect(output).toContain("Failed to clone");
    });

    it("skips confirmation with --force when .eni/ exists", async () => {
      vi.mocked(checkEniExists).mockResolvedValue(true);
      vi.mocked(sparseCloneBoilerplate).mockResolvedValue({
        success: true,
        tempDir: "/tmp/clone",
      });
      vi.mocked(copyAiFiles).mockResolvedValue({
        success: true,
        copiedFiles: [".eni/PROMPT_plan.md"],
      });
      vi.mocked(ensureSpecsFolder).mockResolvedValue({
        success: true,
        created: false,
      });
      vi.mocked(initBeads).mockResolvedValue({ status: "exists" });

      await runAiSetup({
        targetDir: tempDir,
        gitHost: "github.com",
        force: true,
        update: false,
      });

      // Should proceed without readline prompt
      expect(sparseCloneBoilerplate).toHaveBeenCalled();
      const output = logOutput.join("\n");
      expect(output).toContain("Setup complete");
    });
  });

  describe("update mode", () => {
    it("refreshes .claude/ only, preserving .eni/", async () => {
      vi.mocked(checkEniExists).mockResolvedValue(true);
      vi.mocked(sparseCloneBoilerplate).mockResolvedValue({
        success: true,
        tempDir: "/tmp/clone",
      });
      vi.mocked(copyClaudeFilesOnly).mockResolvedValue({
        success: true,
        copiedFiles: [".claude/settings.json", ".claude/commands/cleanup.md"],
      });

      await runAiSetup({
        targetDir: tempDir,
        gitHost: "github.com",
        force: false,
        update: true,
      });

      expect(copyClaudeFilesOnly).toHaveBeenCalledWith("/tmp/clone", tempDir);
      expect(copyAiFiles).not.toHaveBeenCalled();
      expect(ensureSpecsFolder).not.toHaveBeenCalled();
      expect(initBeads).not.toHaveBeenCalled();

      const output = logOutput.join("\n");
      expect(output).toContain(".claude/settings.json");
      expect(output).toContain("preserved");
      expect(output).toContain("Update complete");
    });

    it("errors when .eni/ missing in update mode", async () => {
      vi.mocked(checkEniExists).mockResolvedValue(false);

      await expect(
        runAiSetup({
          targetDir: tempDir,
          gitHost: "github.com",
          force: false,
          update: true,
        }),
      ).rejects.toThrow("process.exit called");

      expect(mockExit).toHaveBeenCalledWith(1);
      const output = logOutput.join("\n");
      expect(output).toContain(".eni/ not found");
      expect(output).toContain("eni ai setup first");
    });
  });

  describe("legacy file cleanup", () => {
    it("detects and removes legacy files with --force", async () => {
      vi.mocked(checkEniExists).mockResolvedValue(false);
      vi.mocked(sparseCloneBoilerplate).mockResolvedValue({
        success: true,
        tempDir: "/tmp/clone",
      });
      vi.mocked(copyAiFiles).mockResolvedValue({
        success: true,
        copiedFiles: [".eni/PROMPT_plan.md"],
      });
      vi.mocked(ensureSpecsFolder).mockResolvedValue({
        success: true,
        created: false,
      });
      vi.mocked(initBeads).mockResolvedValue({ status: "exists" });
      vi.mocked(detectLegacyFiles).mockResolvedValue(["loop.sh", "check_beads.test.sh"]);
      vi.mocked(removeLegacyFiles).mockResolvedValue([".eni/loop.sh", ".eni/check_beads.test.sh"]);

      await runAiSetup({
        targetDir: tempDir,
        gitHost: "github.com",
        force: true,
        update: false,
      });

      expect(removeLegacyFiles).toHaveBeenCalledWith(tempDir, ["loop.sh", "check_beads.test.sh"]);
      const output = logOutput.join("\n");
      expect(output).toContain("Removed .eni/loop.sh");
      expect(output).toContain("Removed .eni/check_beads.test.sh");
    });

    it("skips removal when no legacy files found", async () => {
      vi.mocked(checkEniExists).mockResolvedValue(false);
      vi.mocked(sparseCloneBoilerplate).mockResolvedValue({
        success: true,
        tempDir: "/tmp/clone",
      });
      vi.mocked(copyAiFiles).mockResolvedValue({
        success: true,
        copiedFiles: [".eni/PROMPT_plan.md"],
      });
      vi.mocked(ensureSpecsFolder).mockResolvedValue({
        success: true,
        created: false,
      });
      vi.mocked(initBeads).mockResolvedValue({ status: "exists" });
      vi.mocked(detectLegacyFiles).mockResolvedValue([]);

      await runAiSetup({
        targetDir: tempDir,
        gitHost: "github.com",
        force: false,
        update: false,
      });

      expect(removeLegacyFiles).not.toHaveBeenCalled();
    });
  });

  describe("cleanup on error", () => {
    it("cleans up temp dir even when copy fails", async () => {
      vi.mocked(checkEniExists).mockResolvedValue(false);
      vi.mocked(sparseCloneBoilerplate).mockResolvedValue({
        success: true,
        tempDir: "/tmp/clone",
      });
      vi.mocked(copyAiFiles).mockResolvedValue({
        success: false,
        copiedFiles: [],
        error: "Permission denied",
      });

      await expect(
        runAiSetup({
          targetDir: tempDir,
          gitHost: "github.com",
          force: false,
          update: false,
        }),
      ).rejects.toThrow("process.exit called");

      expect(cleanupTempDir).toHaveBeenCalledWith("/tmp/clone");
    });
  });
});
