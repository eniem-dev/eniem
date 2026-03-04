import { execa } from "execa";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { BOILERPLATE_REPO_PATH } from "./constants.js";
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

/**
 * Sparse clones only .eni and .claude folders from eniem-boilerplate
 * Returns the path to the temp directory containing the cloned folders
 */
export async function sparseCloneBoilerplate(gitHost: string): Promise<{
  success: boolean;
  tempDir: string;
  error?: string;
}> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "eniem-ai-init-"));
  const repoUrl = `git@${gitHost}:${BOILERPLATE_REPO_PATH}`;

  try {
    // Initialize empty repo
    await execa("git", ["init"], { cwd: tempDir });

    // Add remote
    await execa("git", ["remote", "add", "origin", repoUrl], { cwd: tempDir });

    // Enable sparse checkout
    await execa("git", ["config", "core.sparseCheckout", "true"], {
      cwd: tempDir,
    });

    // Set sparse checkout paths
    const sparseCheckoutPath = path.join(
      tempDir,
      ".git",
      "info",
      "sparse-checkout"
    );
    const sparseEntries = [...FOLDERS_TO_COPY, ...FILES_TO_COPY];
    await fs.writeFile(sparseCheckoutPath, sparseEntries.join("\n") + "\n");

    // Fetch and checkout
    await execa("git", ["fetch", "--depth", "1", "origin", "main"], {
      cwd: tempDir,
    });
    await execa("git", ["checkout", "main"], { cwd: tempDir });

    return { success: true, tempDir };
  } catch (error) {
    // Clean up temp dir on error
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

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
