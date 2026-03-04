import { execa } from "execa";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import {
  type Protocol,
  buildSshUrl,
  buildHttpsUrl,
  isNetworkError,
  SSH_TIMEOUT_MS,
} from "./clone.js";
const FOLDERS_TO_COPY = [".eni", ".claude", ".opencode", ".codex", ".agents"];
const FILES_TO_COPY = ["opencode.json"];

export interface CopyReport {
  addedFiles: string[];
  skippedFiles: string[];
}

export interface AiInitResult {
  success: boolean;
  copiedFiles: string[];
  error?: string;
}

/**
 * Checks if .eni folder exists in the target directory
 */
export async function checkEniExists(targetDir: string): Promise<boolean> {
  try {
    const eniPath = path.join(targetDir, ".eni");
    await fs.access(eniPath);
    return true;
  } catch {
    return false;
  }
}

export interface SparseCloneResult {
  success: boolean;
  tempDir: string;
  error?: string;
  fallbackUsed?: boolean;
}

/**
 * Sparse clones only .eni and .claude folders from eniem-boilerplate.
 * Supports protocol selection and SSH→HTTPS fallback on network errors.
 */
export async function sparseCloneBoilerplate(
  gitHost: string,
  protocol?: Protocol,
): Promise<SparseCloneResult> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "eniem-ai-init-"));

  const cleanup = async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  };

  try {
    // Initialize empty repo and configure sparse checkout
    await execa("git", ["init"], { cwd: tempDir });
    await execa("git", ["config", "core.sparseCheckout", "true"], {
      cwd: tempDir,
    });

    const sparseCheckoutPath = path.join(
      tempDir,
      ".git",
      "info",
      "sparse-checkout",
    );
    const sparseEntries = [...FOLDERS_TO_COPY, ...FILES_TO_COPY];
    await fs.writeFile(sparseCheckoutPath, sparseEntries.join("\n") + "\n");

    // Determine initial URL based on protocol
    const initialUrl =
      protocol === "https"
        ? buildHttpsUrl(gitHost)
        : buildSshUrl(gitHost);

    await execa("git", ["remote", "add", "origin", initialUrl], {
      cwd: tempDir,
    });

    // Attempt fetch with timeout for default protocol (SSH with fallback)
    const useTimeout = protocol === undefined;
    let fallbackUsed = false;

    try {
      await execa(
        "git",
        ["fetch", "--depth", "1", "origin", "main"],
        { cwd: tempDir, ...(useTimeout ? { timeout: SSH_TIMEOUT_MS } : {}) },
      );
    } catch (fetchError) {
      // Only fallback when protocol is auto-detected (undefined) and it's a network error
      if (protocol !== undefined || !isNetworkError(fetchError)) {
        throw fetchError;
      }

      // Switch remote to HTTPS and retry
      const httpsUrl = buildHttpsUrl(gitHost);
      await execa(
        "git",
        ["remote", "set-url", "origin", httpsUrl],
        { cwd: tempDir },
      );
      await execa(
        "git",
        ["fetch", "--depth", "1", "origin", "main"],
        { cwd: tempDir },
      );
      fallbackUsed = true;
    }

    await execa("git", ["checkout", "main"], { cwd: tempDir });

    return { success: true, tempDir, fallbackUsed };
  } catch (error) {
    await cleanup();
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, tempDir: "", error: errorMessage };
  }
}

/**
 * Copies AI config folders from source to target using additive merge.
 * Files that don't exist locally are added; existing files are preserved.
 * Returns a report of which files were added vs skipped.
 */
export async function copyAiFiles(
  sourceDir: string,
  targetDir: string
): Promise<{ success: boolean; report: CopyReport; error?: string }> {
  const report: CopyReport = { addedFiles: [], skippedFiles: [] };

  try {
    for (const folder of FOLDERS_TO_COPY) {
      const sourcePath = path.join(sourceDir, folder);

      // Check if source folder exists
      try {
        await fs.access(sourcePath);
      } catch {
        continue; // Skip if folder doesn't exist in source
      }

      // Recursively merge folder (skip existing files)
      await mergeDir(sourcePath, path.join(targetDir, folder), folder, report);
    }

    // Merge root files (skip if already exists)
    for (const file of FILES_TO_COPY) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);

      try {
        await fs.access(sourcePath);
      } catch {
        continue; // Skip if file doesn't exist in source
      }

      try {
        await fs.access(targetPath);
        report.skippedFiles.push(file);
      } catch {
        await fs.copyFile(sourcePath, targetPath);
        report.addedFiles.push(file);
      }
    }

    return { success: true, report };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, report, error: errorMessage };
  }
}

/**
 * Recursively merges a directory, skipping files that already exist at dest
 */
async function mergeDir(
  src: string,
  dest: string,
  basePath: string,
  report: CopyReport
): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    const relativePath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      await mergeDir(srcPath, destPath, relativePath, report);
    } else {
      try {
        await fs.access(destPath);
        report.skippedFiles.push(relativePath);
      } catch {
        await fs.copyFile(srcPath, destPath);
        report.addedFiles.push(relativePath);
      }
    }
  }
}

/**
 * Ensures specs folder exists with .gitkeep if empty
 */
export async function ensureSpecsFolder(targetDir: string): Promise<{
  success: boolean;
  created: boolean;
  error?: string;
}> {
  const specsPath = path.join(targetDir, "specs");
  const gitkeepPath = path.join(specsPath, ".gitkeep");

  try {
    // Check if specs folder exists
    try {
      await fs.access(specsPath);
      // Folder exists, check if it's empty
      const entries = await fs.readdir(specsPath);
      if (entries.length === 0) {
        // Empty folder, add .gitkeep
        await fs.writeFile(gitkeepPath, "");
      }
      return { success: true, created: false };
    } catch {
      // Folder doesn't exist, create it with .gitkeep
      await fs.mkdir(specsPath, { recursive: true });
      await fs.writeFile(gitkeepPath, "");
      return { success: true, created: true };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, created: false, error: errorMessage };
  }
}

export interface LegacySymlinkResult {
  handled: boolean;
  action?: "symlink_reversed";
}

/**
 * Ensures AGENTS.md is the primary file and CLAUDE.md is a symlink to it.
 * Handles legacy projects where CLAUDE.md was the primary file.
 *
 * - If CLAUDE.md is a real file and AGENTS.md doesn't exist:
 *   rename CLAUDE.md → AGENTS.md, create CLAUDE.md as symlink → AGENTS.md
 * - Otherwise: no-op
 */
export async function ensureAgentsMdPrimary(targetDir: string): Promise<LegacySymlinkResult> {
  const claudePath = path.join(targetDir, "CLAUDE.md");
  const agentsPath = path.join(targetDir, "AGENTS.md");

  try {
    const claudeStat = await fs.lstat(claudePath);

    // If CLAUDE.md is already a symlink, nothing to do
    if (claudeStat.isSymbolicLink()) {
      return { handled: false };
    }

    // CLAUDE.md is a real file — check if AGENTS.md exists
    try {
      await fs.lstat(agentsPath);
      // AGENTS.md already exists, don't overwrite
      return { handled: false };
    } catch {
      // AGENTS.md doesn't exist — reverse the symlink
      await fs.rename(claudePath, agentsPath);
      await fs.symlink("AGENTS.md", claudePath);
      return { handled: true, action: "symlink_reversed" };
    }
  } catch {
    // CLAUDE.md doesn't exist at all, nothing to do
    return { handled: false };
  }
}

/**
 * Cleans up temporary directory
 */
export async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

/** Maps each CLI to its config folders and root files */
export const CLI_CONFIG_PATHS: Record<string, { folders: string[]; rootFiles: string[] }> = {
  claude: { folders: [".claude"], rootFiles: [] },
  opencode: { folders: [".opencode"], rootFiles: ["opencode.json"] },
  codex: { folders: [".codex", ".agents"], rootFiles: [] },
  gemini: { folders: [], rootFiles: [] },
};

export interface CliFileInfo {
  cliId: string;
  cliName: string;
  folders: { path: string; fileCount: number }[];
  rootFiles: string[];
  hasFiles: boolean;
}

/** Counts files recursively in a directory */
async function countFiles(dirPath: string): Promise<number> {
  let count = 0;
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      count += await countFiles(path.join(dirPath, entry.name));
    } else {
      count++;
    }
  }
  return count;
}

/** Checks which config files exist for a CLI */
export async function getCliFileInfo(
  targetDir: string,
  cliId: string,
  cliName: string,
): Promise<CliFileInfo> {
  const config = CLI_CONFIG_PATHS[cliId] ?? { folders: [], rootFiles: [] };
  const folders: { path: string; fileCount: number }[] = [];
  const rootFiles: string[] = [];

  for (const folder of config.folders) {
    try {
      await fs.access(path.join(targetDir, folder));
      const fileCount = await countFiles(path.join(targetDir, folder));
      folders.push({ path: folder, fileCount });
    } catch {
      // Folder doesn't exist
    }
  }

  for (const file of config.rootFiles) {
    try {
      await fs.access(path.join(targetDir, file));
      rootFiles.push(file);
    } catch {
      // File doesn't exist
    }
  }

  return { cliId, cliName, folders, rootFiles, hasFiles: folders.length > 0 || rootFiles.length > 0 };
}

/** Removes all config files and folders for a CLI */
export async function removeCliConfig(targetDir: string, cliId: string): Promise<void> {
  const config = CLI_CONFIG_PATHS[cliId] ?? { folders: [], rootFiles: [] };
  for (const folder of config.folders) {
    await fs.rm(path.join(targetDir, folder), { recursive: true, force: true });
  }
  for (const file of config.rootFiles) {
    await fs.rm(path.join(targetDir, file), { force: true });
  }
}

export interface CliRestoreReport {
  cliId: string;
  cliName: string;
  report: CopyReport;
}

/**
 * Returns CLI IDs from the given list that have missing config folders or root files.
 */
export async function findClisNeedingRestore(
  targetDir: string,
  cliIds: string[],
): Promise<string[]> {
  const needsRestore: string[] = [];

  for (const cliId of cliIds) {
    const config = CLI_CONFIG_PATHS[cliId] ?? { folders: [], rootFiles: [] };
    let hasMissing = false;

    for (const folder of config.folders) {
      try {
        await fs.access(path.join(targetDir, folder));
      } catch {
        hasMissing = true;
        break;
      }
    }

    if (!hasMissing) {
      for (const file of config.rootFiles) {
        try {
          await fs.access(path.join(targetDir, file));
        } catch {
          hasMissing = true;
          break;
        }
      }
    }

    if (hasMissing) {
      needsRestore.push(cliId);
    }
  }

  return needsRestore;
}

/**
 * Restores config files for specific CLIs from a boilerplate clone.
 * Uses additive merge — new files are added, existing files are preserved.
 */
export async function restoreCliConfigs(
  sourceDir: string,
  targetDir: string,
  cliIds: string[],
  cliNames: Record<string, string>,
): Promise<{ success: boolean; reports: CliRestoreReport[]; error?: string }> {
  const reports: CliRestoreReport[] = [];

  try {
    for (const cliId of cliIds) {
      const config = CLI_CONFIG_PATHS[cliId] ?? { folders: [], rootFiles: [] };
      const report: CopyReport = { addedFiles: [], skippedFiles: [] };

      for (const folder of config.folders) {
        const sourcePath = path.join(sourceDir, folder);
        try {
          await fs.access(sourcePath);
          await mergeDir(sourcePath, path.join(targetDir, folder), folder, report);
        } catch {
          continue;
        }
      }

      for (const file of config.rootFiles) {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);
        try {
          await fs.access(sourcePath);
        } catch {
          continue;
        }
        try {
          await fs.access(targetPath);
          report.skippedFiles.push(file);
        } catch {
          await fs.copyFile(sourcePath, targetPath);
          report.addedFiles.push(file);
        }
      }

      reports.push({ cliId, cliName: cliNames[cliId] ?? cliId, report });
    }

    return { success: true, reports };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, reports, error: errorMessage };
  }
}
