import { execa } from "execa";
import { rm } from "fs/promises";
import { join } from "path";

export interface InitGitOptions {
  destination: string;
  onProgress?: (message: string) => void;
}

export interface InitGitResult {
  success: boolean;
  error?: string;
}

export async function initGitRepo({
  destination,
  onProgress,
}: InitGitOptions): Promise<InitGitResult> {
  try {
    // Remove existing .git directory from cloned template
    const gitDir = join(destination, ".git");
    onProgress?.("Removing existing .git directory...");
    try {
      await rm(gitDir, { recursive: true, force: true });
    } catch {
      // Ignore if .git doesn't exist
    }

    // Initialize fresh git repository
    onProgress?.("Initializing fresh git repository...");
    await execa("git", ["init"], { cwd: destination });

    // Add all files
    onProgress?.("Staging files...");
    await execa("git", ["add", "."], { cwd: destination });

    // Create initial commit
    onProgress?.("Creating initial commit...");
    await execa("git", ["commit", "-m", "Initial commit from eni"], {
      cwd: destination,
    });

    onProgress?.("Git repository initialized!");

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    if (errorMessage.includes("not a git repository")) {
      return {
        success: false,
        error: "Failed to initialize git repository. Please ensure git is installed.",
      };
    }

    if (errorMessage.includes("ENOENT")) {
      return {
        success: false,
        error: "Git command not found. Please install git and try again.",
      };
    }

    return {
      success: false,
      error: `Failed to initialize git repository: ${errorMessage}`,
    };
  }
}
