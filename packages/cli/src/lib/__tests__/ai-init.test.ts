import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import {
  checkEniExists,
  sparseCloneBoilerplate,
  copyAiFiles,
  ensureSpecsFolder,
  ensureAgentsMdPrimary,
  cleanupTempDir,
  getCliFileInfo,
  removeCliConfig,
  findClisNeedingRestore,
  restoreCliConfigs,
} from "../ai-init.js";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

import { execa } from "execa";

describe("ai-init", () => {
  let tempDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ai-init-test-"));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("checkEniExists", () => {
    it("returns true when .eni folder exists", async () => {
      const eniPath = path.join(tempDir, ".eni");
      await fs.mkdir(eniPath);

      const result = await checkEniExists(tempDir);
      expect(result).toBe(true);
    });

    it("returns false when .eni folder does not exist", async () => {
      const result = await checkEniExists(tempDir);
      expect(result).toBe(false);
    });
  });

  describe("sparseCloneBoilerplate", () => {
    it("runs git commands for sparse clone", async () => {
      // Mock execa to simulate git commands and create the sparse-checkout directory
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(execa).mockImplementation((async (...mockArgs: any[]) => {
        const [cmd, args, options] = mockArgs;
        // When git init is called, create the .git/info directory structure
        if (
          cmd === "git" &&
          Array.isArray(args) &&
          args[0] === "init" &&
          options?.cwd
        ) {
          const gitInfoPath = path.join(options.cwd as string, ".git", "info");
          await fs.mkdir(gitInfoPath, { recursive: true });
        }
        return {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any);

      const result = await sparseCloneBoilerplate("github.com");

      expect(result.success).toBe(true);
      expect(result.tempDir).toBeTruthy();

      // Verify sparse-checkout includes all CLI folders and root files
      const sparseCheckoutPath = path.join(
        result.tempDir,
        ".git",
        "info",
        "sparse-checkout"
      );
      const sparseContent = await fs.readFile(sparseCheckoutPath, "utf-8");
      expect(sparseContent).toContain(".eni");
      expect(sparseContent).toContain(".claude");
      expect(sparseContent).toContain(".opencode");
      expect(sparseContent).toContain(".codex");
      expect(sparseContent).toContain(".agents");
      expect(sparseContent).toContain("opencode.json");

      // Verify git commands were called
      expect(execa).toHaveBeenCalledWith("git", ["init"], expect.any(Object));
      expect(execa).toHaveBeenCalledWith(
        "git",
        ["remote", "add", "origin", "git@github.com:eniem-dev/eniem-boilerplate.git"],
        expect.any(Object)
      );
      expect(execa).toHaveBeenCalledWith(
        "git",
        ["config", "core.sparseCheckout", "true"],
        expect.any(Object)
      );
      expect(execa).toHaveBeenCalledWith(
        "git",
        ["fetch", "--depth", "1", "origin", "main"],
        expect.any(Object)
      );
      expect(execa).toHaveBeenCalledWith(
        "git",
        ["checkout", "main"],
        expect.any(Object)
      );

      // Clean up the temp dir created by the function
      await cleanupTempDir(result.tempDir);
    });

    it("returns error when git commands fail", async () => {
      vi.mocked(execa).mockRejectedValue(new Error("git command failed"));

      const result = await sparseCloneBoilerplate("github.com");

      expect(result.success).toBe(false);
      expect(result.error).toContain("git command failed");
    });
  });

  describe("copyAiFiles", () => {
    it("adds new files from source to empty target", async () => {
      const sourceDir = path.join(tempDir, "source");
      const targetDir = path.join(tempDir, "target");
      await fs.mkdir(sourceDir);
      await fs.mkdir(targetDir);

      // Create source structure
      const eniDir = path.join(sourceDir, ".eni");
      await fs.mkdir(eniDir);
      await fs.writeFile(path.join(eniDir, "loop.sh"), "#!/bin/bash\n");

      const claudeDir = path.join(sourceDir, ".claude");
      const commandsDir = path.join(claudeDir, "commands");
      await fs.mkdir(commandsDir, { recursive: true });
      await fs.writeFile(path.join(claudeDir, "settings.local.json"), "{}");
      await fs.writeFile(path.join(commandsDir, "test.md"), "# Test\n");

      const opencodeDir = path.join(sourceDir, ".opencode");
      const opencodeSkillsDir = path.join(opencodeDir, "skills");
      await fs.mkdir(opencodeSkillsDir, { recursive: true });
      await fs.writeFile(path.join(opencodeSkillsDir, "build.md"), "# Build\n");

      const codexDir = path.join(sourceDir, ".codex");
      await fs.mkdir(codexDir);
      await fs.writeFile(path.join(codexDir, "config.toml"), "[codex]\n");

      const agentsDir = path.join(sourceDir, ".agents");
      const agentsSkillsDir = path.join(agentsDir, "skills");
      await fs.mkdir(agentsSkillsDir, { recursive: true });
      await fs.writeFile(path.join(agentsSkillsDir, "plan.md"), "# Plan\n");

      await fs.writeFile(path.join(sourceDir, "opencode.json"), '{"theme":"dark"}');

      const result = await copyAiFiles(sourceDir, targetDir);

      expect(result.success).toBe(true);
      expect(result.report.addedFiles).toContain(".eni/loop.sh");
      expect(result.report.addedFiles).toContain(".claude/settings.local.json");
      expect(result.report.addedFiles).toContain(".claude/commands/test.md");
      expect(result.report.addedFiles).toContain(".opencode/skills/build.md");
      expect(result.report.addedFiles).toContain(".codex/config.toml");
      expect(result.report.addedFiles).toContain(".agents/skills/plan.md");
      expect(result.report.addedFiles).toContain("opencode.json");
      expect(result.report.skippedFiles).toHaveLength(0);

      // Verify files exist in target
      expect(await fs.stat(path.join(targetDir, ".eni", "loop.sh"))).toBeTruthy();
      expect(await fs.stat(path.join(targetDir, ".claude", "commands", "test.md"))).toBeTruthy();
      const opencodeJson = await fs.readFile(path.join(targetDir, "opencode.json"), "utf-8");
      expect(opencodeJson).toBe('{"theme":"dark"}');
    });

    it("preserves existing files and only adds missing ones", async () => {
      const sourceDir = path.join(tempDir, "source");
      const targetDir = path.join(tempDir, "target");
      await fs.mkdir(sourceDir);
      await fs.mkdir(targetDir);

      // Create source .eni with two files
      const sourceEni = path.join(sourceDir, ".eni");
      await fs.mkdir(sourceEni);
      await fs.writeFile(path.join(sourceEni, "new-file.txt"), "new content");
      await fs.writeFile(path.join(sourceEni, "existing.txt"), "template content");

      // Create target .eni with one existing file (different content)
      const targetEni = path.join(targetDir, ".eni");
      await fs.mkdir(targetEni);
      await fs.writeFile(path.join(targetEni, "existing.txt"), "user customized");

      const result = await copyAiFiles(sourceDir, targetDir);

      expect(result.success).toBe(true);
      expect(result.report.addedFiles).toContain(".eni/new-file.txt");
      expect(result.report.skippedFiles).toContain(".eni/existing.txt");

      // New file should be added
      const newContent = await fs.readFile(path.join(targetDir, ".eni", "new-file.txt"), "utf-8");
      expect(newContent).toBe("new content");

      // Existing file should NOT be overwritten
      const existingContent = await fs.readFile(path.join(targetDir, ".eni", "existing.txt"), "utf-8");
      expect(existingContent).toBe("user customized");
    });

    it("skips existing root files", async () => {
      const sourceDir = path.join(tempDir, "source");
      const targetDir = path.join(tempDir, "target");
      await fs.mkdir(sourceDir);
      await fs.mkdir(targetDir);

      // Source has opencode.json
      await fs.writeFile(path.join(sourceDir, "opencode.json"), '{"template":true}');

      // Target already has opencode.json with user customizations
      await fs.writeFile(path.join(targetDir, "opencode.json"), '{"user":"custom"}');

      const result = await copyAiFiles(sourceDir, targetDir);

      expect(result.success).toBe(true);
      expect(result.report.skippedFiles).toContain("opencode.json");
      expect(result.report.addedFiles).not.toContain("opencode.json");

      // User's file should be preserved
      const content = await fs.readFile(path.join(targetDir, "opencode.json"), "utf-8");
      expect(content).toBe('{"user":"custom"}');
    });

    it("works with nested directories", async () => {
      const sourceDir = path.join(tempDir, "source");
      const targetDir = path.join(tempDir, "target");
      await fs.mkdir(sourceDir);
      await fs.mkdir(targetDir);

      // Source has nested skill directory
      const skillDir = path.join(sourceDir, ".claude", "skills", "custom-skill");
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, "SKILL.md"), "# Template skill");

      // Target has the same skill directory with user customization
      const targetSkillDir = path.join(targetDir, ".claude", "skills", "custom-skill");
      await fs.mkdir(targetSkillDir, { recursive: true });
      await fs.writeFile(path.join(targetSkillDir, "SKILL.md"), "# My custom skill");

      const result = await copyAiFiles(sourceDir, targetDir);

      expect(result.success).toBe(true);
      expect(result.report.skippedFiles).toContain(".claude/skills/custom-skill/SKILL.md");

      // User's customization preserved
      const content = await fs.readFile(path.join(targetSkillDir, "SKILL.md"), "utf-8");
      expect(content).toBe("# My custom skill");
    });

    it("skips folders that do not exist in source", async () => {
      const sourceDir = path.join(tempDir, "source");
      const targetDir = path.join(tempDir, "target");
      await fs.mkdir(sourceDir);
      await fs.mkdir(targetDir);

      // Only create .eni, not .claude
      const eniDir = path.join(sourceDir, ".eni");
      await fs.mkdir(eniDir);
      await fs.writeFile(path.join(eniDir, "file.txt"), "content");

      const result = await copyAiFiles(sourceDir, targetDir);

      expect(result.success).toBe(true);
      expect(result.report.addedFiles).toContain(".eni/file.txt");
      expect(result.report.addedFiles.some((f) => f.startsWith(".claude"))).toBe(false);
    });
  });

  describe("ensureSpecsFolder", () => {
    it("creates specs folder with .gitkeep when it does not exist", async () => {
      const result = await ensureSpecsFolder(tempDir);

      expect(result.success).toBe(true);
      expect(result.created).toBe(true);

      const specsPath = path.join(tempDir, "specs");
      const gitkeepPath = path.join(specsPath, ".gitkeep");

      expect(await fs.stat(specsPath)).toBeTruthy();
      expect(await fs.stat(gitkeepPath)).toBeTruthy();
    });

    it("does not modify specs folder when it has content", async () => {
      const specsPath = path.join(tempDir, "specs");
      await fs.mkdir(specsPath);
      await fs.writeFile(path.join(specsPath, "existing-spec.md"), "# Spec\n");

      const result = await ensureSpecsFolder(tempDir);

      expect(result.success).toBe(true);
      expect(result.created).toBe(false);

      // Existing file should still be there
      const content = await fs.readFile(
        path.join(specsPath, "existing-spec.md"),
        "utf-8"
      );
      expect(content).toBe("# Spec\n");

      // .gitkeep should not have been added
      await expect(
        fs.access(path.join(specsPath, ".gitkeep"))
      ).rejects.toThrow();
    });

    it("adds .gitkeep to empty specs folder", async () => {
      const specsPath = path.join(tempDir, "specs");
      await fs.mkdir(specsPath);

      const result = await ensureSpecsFolder(tempDir);

      expect(result.success).toBe(true);
      expect(result.created).toBe(false);

      // .gitkeep should have been added
      expect(await fs.stat(path.join(specsPath, ".gitkeep"))).toBeTruthy();
    });
  });

  describe("cleanupTempDir", () => {
    it("removes temporary directory", async () => {
      const testTempDir = await fs.mkdtemp(
        path.join(os.tmpdir(), "cleanup-test-")
      );
      await fs.writeFile(path.join(testTempDir, "test.txt"), "content");

      await cleanupTempDir(testTempDir);

      await expect(fs.access(testTempDir)).rejects.toThrow();
    });

    it("does not throw on non-existent directory", async () => {
      await expect(
        cleanupTempDir("/non/existent/path")
      ).resolves.not.toThrow();
    });
  });

  describe("getCliFileInfo", () => {
    it("detects existing config folder with file count", async () => {
      // Create .opencode/ with 2 files
      const opencodeDir = path.join(tempDir, ".opencode");
      await fs.mkdir(path.join(opencodeDir, "skills"), { recursive: true });
      await fs.writeFile(path.join(opencodeDir, "config.json"), "{}");
      await fs.writeFile(path.join(opencodeDir, "skills", "build.md"), "# Build");

      const info = await getCliFileInfo(tempDir, "opencode", "OpenCode");

      expect(info.hasFiles).toBe(true);
      expect(info.folders).toHaveLength(1);
      expect(info.folders[0].path).toBe(".opencode");
      expect(info.folders[0].fileCount).toBe(2);
    });

    it("detects root files for opencode", async () => {
      await fs.writeFile(path.join(tempDir, "opencode.json"), "{}");

      const info = await getCliFileInfo(tempDir, "opencode", "OpenCode");

      expect(info.hasFiles).toBe(true);
      expect(info.rootFiles).toContain("opencode.json");
    });

    it("returns hasFiles=false when no config exists", async () => {
      const info = await getCliFileInfo(tempDir, "claude", "Claude Code");

      expect(info.hasFiles).toBe(false);
      expect(info.folders).toHaveLength(0);
      expect(info.rootFiles).toHaveLength(0);
    });

    it("detects both .codex and .agents folders for codex", async () => {
      await fs.mkdir(path.join(tempDir, ".codex"));
      await fs.writeFile(path.join(tempDir, ".codex", "config.toml"), "[codex]");
      await fs.mkdir(path.join(tempDir, ".agents", "skills"), { recursive: true });
      await fs.writeFile(path.join(tempDir, ".agents", "skills", "plan.md"), "# Plan");

      const info = await getCliFileInfo(tempDir, "codex", "Codex");

      expect(info.hasFiles).toBe(true);
      expect(info.folders).toHaveLength(2);
      expect(info.folders.map((f) => f.path)).toEqual([".codex", ".agents"]);
    });

    it("skips non-existent folders while detecting existing ones", async () => {
      // Only .codex exists, not .agents
      await fs.mkdir(path.join(tempDir, ".codex"));
      await fs.writeFile(path.join(tempDir, ".codex", "config.toml"), "[codex]");

      const info = await getCliFileInfo(tempDir, "codex", "Codex");

      expect(info.hasFiles).toBe(true);
      expect(info.folders).toHaveLength(1);
      expect(info.folders[0].path).toBe(".codex");
    });
  });

  describe("removeCliConfig", () => {
    it("removes config folder and root files for opencode", async () => {
      const opencodeDir = path.join(tempDir, ".opencode");
      await fs.mkdir(opencodeDir);
      await fs.writeFile(path.join(opencodeDir, "config.json"), "{}");
      await fs.writeFile(path.join(tempDir, "opencode.json"), "{}");

      await removeCliConfig(tempDir, "opencode");

      await expect(fs.access(opencodeDir)).rejects.toThrow();
      await expect(fs.access(path.join(tempDir, "opencode.json"))).rejects.toThrow();
    });

    it("removes both .codex and .agents for codex", async () => {
      await fs.mkdir(path.join(tempDir, ".codex"));
      await fs.writeFile(path.join(tempDir, ".codex", "config.toml"), "[codex]");
      await fs.mkdir(path.join(tempDir, ".agents"));
      await fs.writeFile(path.join(tempDir, ".agents", "plan.md"), "# Plan");

      await removeCliConfig(tempDir, "codex");

      await expect(fs.access(path.join(tempDir, ".codex"))).rejects.toThrow();
      await expect(fs.access(path.join(tempDir, ".agents"))).rejects.toThrow();
    });

    it("does not throw when config does not exist", async () => {
      await expect(removeCliConfig(tempDir, "claude")).resolves.not.toThrow();
    });

    it("removes nested files within config folder", async () => {
      const claudeDir = path.join(tempDir, ".claude");
      await fs.mkdir(path.join(claudeDir, "skills", "custom"), { recursive: true });
      await fs.writeFile(path.join(claudeDir, "settings.json"), "{}");
      await fs.writeFile(path.join(claudeDir, "skills", "custom", "SKILL.md"), "# Skill");

      await removeCliConfig(tempDir, "claude");

      await expect(fs.access(claudeDir)).rejects.toThrow();
    });
  });

  describe("findClisNeedingRestore", () => {
    it("returns CLIs with missing config folders", async () => {
      // Only .claude exists, .opencode does not
      await fs.mkdir(path.join(tempDir, ".claude"));

      const result = await findClisNeedingRestore(tempDir, ["claude", "opencode"]);

      expect(result).toEqual(["opencode"]);
    });

    it("returns CLIs with missing root files", async () => {
      // .opencode folder exists but opencode.json does not
      await fs.mkdir(path.join(tempDir, ".opencode"));

      const result = await findClisNeedingRestore(tempDir, ["opencode"]);

      expect(result).toEqual(["opencode"]);
    });

    it("returns empty when all configs are present", async () => {
      await fs.mkdir(path.join(tempDir, ".claude"));
      await fs.mkdir(path.join(tempDir, ".opencode"));
      await fs.writeFile(path.join(tempDir, "opencode.json"), "{}");

      const result = await findClisNeedingRestore(tempDir, ["claude", "opencode"]);

      expect(result).toEqual([]);
    });

    it("detects missing .agents folder for codex", async () => {
      // .codex exists but .agents does not
      await fs.mkdir(path.join(tempDir, ".codex"));

      const result = await findClisNeedingRestore(tempDir, ["codex"]);

      expect(result).toEqual(["codex"]);
    });

    it("skips CLIs with no config paths defined", async () => {
      const result = await findClisNeedingRestore(tempDir, ["unknown-cli"]);

      expect(result).toEqual([]);
    });
  });

  describe("ensureAgentsMdPrimary", () => {
    it("reverses symlink when CLAUDE.md is primary and AGENTS.md missing", async () => {
      await fs.writeFile(path.join(tempDir, "CLAUDE.md"), "# Instructions");

      const result = await ensureAgentsMdPrimary(tempDir);

      expect(result.handled).toBe(true);
      expect(result.action).toBe("symlink_reversed");

      // AGENTS.md should now be the real file
      const agentsStat = await fs.lstat(path.join(tempDir, "AGENTS.md"));
      expect(agentsStat.isSymbolicLink()).toBe(false);
      const agentsContent = await fs.readFile(path.join(tempDir, "AGENTS.md"), "utf-8");
      expect(agentsContent).toBe("# Instructions");

      // CLAUDE.md should be a symlink to AGENTS.md
      const claudeStat = await fs.lstat(path.join(tempDir, "CLAUDE.md"));
      expect(claudeStat.isSymbolicLink()).toBe(true);
      const target = await fs.readlink(path.join(tempDir, "CLAUDE.md"));
      expect(target).toBe("AGENTS.md");
    });

    it("does nothing when CLAUDE.md is already a symlink", async () => {
      await fs.writeFile(path.join(tempDir, "AGENTS.md"), "# Instructions");
      await fs.symlink("AGENTS.md", path.join(tempDir, "CLAUDE.md"));

      const result = await ensureAgentsMdPrimary(tempDir);

      expect(result.handled).toBe(false);
    });

    it("does nothing when both CLAUDE.md and AGENTS.md are real files", async () => {
      await fs.writeFile(path.join(tempDir, "CLAUDE.md"), "# Claude");
      await fs.writeFile(path.join(tempDir, "AGENTS.md"), "# Agents");

      const result = await ensureAgentsMdPrimary(tempDir);

      expect(result.handled).toBe(false);
      // Both files should be unchanged
      const claudeContent = await fs.readFile(path.join(tempDir, "CLAUDE.md"), "utf-8");
      expect(claudeContent).toBe("# Claude");
      const agentsContent = await fs.readFile(path.join(tempDir, "AGENTS.md"), "utf-8");
      expect(agentsContent).toBe("# Agents");
    });

    it("does nothing when neither file exists", async () => {
      const result = await ensureAgentsMdPrimary(tempDir);

      expect(result.handled).toBe(false);
    });
  });

  describe("restoreCliConfigs", () => {
    let sourceDir: string;

    beforeEach(async () => {
      sourceDir = path.join(tempDir, "source");
      await fs.mkdir(sourceDir);
    });

    it("restores missing config files for a CLI", async () => {
      const targetDir = path.join(tempDir, "target");
      await fs.mkdir(targetDir);

      // Create source with .claude config
      await fs.mkdir(path.join(sourceDir, ".claude", "commands"), { recursive: true });
      await fs.writeFile(path.join(sourceDir, ".claude", "settings.json"), '{"perms":true}');
      await fs.writeFile(path.join(sourceDir, ".claude", "commands", "review.md"), "# Review");

      const result = await restoreCliConfigs(sourceDir, targetDir, ["claude"], { claude: "Claude Code" });

      expect(result.success).toBe(true);
      expect(result.reports).toHaveLength(1);
      expect(result.reports[0].cliName).toBe("Claude Code");
      expect(result.reports[0].report.addedFiles).toContain(".claude/settings.json");
      expect(result.reports[0].report.addedFiles).toContain(".claude/commands/review.md");

      // Verify files exist
      const content = await fs.readFile(path.join(targetDir, ".claude", "settings.json"), "utf-8");
      expect(content).toBe('{"perms":true}');
    });

    it("preserves existing files during restoration", async () => {
      const targetDir = path.join(tempDir, "target");
      await fs.mkdir(path.join(targetDir, ".claude"), { recursive: true });
      await fs.writeFile(path.join(targetDir, ".claude", "settings.json"), '{"user":"custom"}');

      // Source has same file plus a new one
      await fs.mkdir(path.join(sourceDir, ".claude"), { recursive: true });
      await fs.writeFile(path.join(sourceDir, ".claude", "settings.json"), '{"template":true}');
      await fs.writeFile(path.join(sourceDir, ".claude", "new-file.md"), "# New");

      const result = await restoreCliConfigs(sourceDir, targetDir, ["claude"], { claude: "Claude Code" });

      expect(result.success).toBe(true);
      expect(result.reports[0].report.addedFiles).toContain(".claude/new-file.md");
      expect(result.reports[0].report.skippedFiles).toContain(".claude/settings.json");

      // User's file preserved
      const content = await fs.readFile(path.join(targetDir, ".claude", "settings.json"), "utf-8");
      expect(content).toBe('{"user":"custom"}');
    });

    it("restores root files for opencode", async () => {
      const targetDir = path.join(tempDir, "target");
      await fs.mkdir(targetDir);

      await fs.mkdir(path.join(sourceDir, ".opencode"), { recursive: true });
      await fs.writeFile(path.join(sourceDir, ".opencode", "config.json"), "{}");
      await fs.writeFile(path.join(sourceDir, "opencode.json"), '{"theme":"dark"}');

      const result = await restoreCliConfigs(sourceDir, targetDir, ["opencode"], { opencode: "OpenCode" });

      expect(result.success).toBe(true);
      expect(result.reports[0].report.addedFiles).toContain("opencode.json");

      const content = await fs.readFile(path.join(targetDir, "opencode.json"), "utf-8");
      expect(content).toBe('{"theme":"dark"}');
    });

    it("restores multiple CLIs at once", async () => {
      const targetDir = path.join(tempDir, "target");
      await fs.mkdir(targetDir);

      await fs.mkdir(path.join(sourceDir, ".claude"), { recursive: true });
      await fs.writeFile(path.join(sourceDir, ".claude", "settings.json"), "{}");
      await fs.mkdir(path.join(sourceDir, ".codex"), { recursive: true });
      await fs.writeFile(path.join(sourceDir, ".codex", "config.toml"), "[codex]");

      const result = await restoreCliConfigs(sourceDir, targetDir, ["claude", "codex"], {
        claude: "Claude Code",
        codex: "Codex",
      });

      expect(result.success).toBe(true);
      expect(result.reports).toHaveLength(2);
      expect(result.reports[0].cliName).toBe("Claude Code");
      expect(result.reports[1].cliName).toBe("Codex");
    });

    it("uses CLI ID as fallback name when name not provided", async () => {
      const targetDir = path.join(tempDir, "target");
      await fs.mkdir(targetDir);

      await fs.mkdir(path.join(sourceDir, ".claude"), { recursive: true });
      await fs.writeFile(path.join(sourceDir, ".claude", "settings.json"), "{}");

      const result = await restoreCliConfigs(sourceDir, targetDir, ["claude"], {});

      expect(result.success).toBe(true);
      expect(result.reports[0].cliName).toBe("claude");
    });

    it("handles source folder not existing gracefully", async () => {
      const targetDir = path.join(tempDir, "target");
      await fs.mkdir(targetDir);

      // Source has no .claude folder
      const result = await restoreCliConfigs(sourceDir, targetDir, ["claude"], { claude: "Claude Code" });

      expect(result.success).toBe(true);
      expect(result.reports[0].report.addedFiles).toHaveLength(0);
      expect(result.reports[0].report.skippedFiles).toHaveLength(0);
    });
  });
});
