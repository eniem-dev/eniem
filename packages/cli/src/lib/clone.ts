import { execa } from "execa";
import { BOILERPLATE_REPO_PATH } from "./constants.js";

export interface CloneOptions {
  projectName: string;
  gitHost: string;
  onProgress?: (message: string) => void;
}

export interface CloneResult {
  success: boolean;
  destination: string;
  error?: string;
}

export async function cloneBoilerplate({
  projectName,
  gitHost,
  onProgress,
}: CloneOptions): Promise<CloneResult> {
  const destination = `./${projectName}`;
  const repoUrl = `git@${gitHost}:${BOILERPLATE_REPO_PATH}`;

  onProgress?.("Cloning boilerplate repository...");

  try {
    await execa("git", ["clone", "--depth", "1", repoUrl, destination]);

    onProgress?.("Clone complete!");

    return {
      success: true,
      destination,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Handle git not installed
    if (errorMessage.includes("ENOENT")) {
      return {
        success: false,
        destination,
        error: "Git is not installed. Please install git and try again.",
      };
    }

    // Handle auth/permission errors
    if (
      errorMessage.includes("Permission denied") ||
      errorMessage.includes("Could not read from remote repository")
    ) {
      return {
        success: false,
        destination,
        error: "SSH access denied. Ensure your SSH key has access to eniem-dev/eniem-boilerplate.",
      };
    }

    // Handle repo not found (usually also auth issue with private repos)
    if (
      errorMessage.includes("Repository not found") ||
      errorMessage.includes("does not exist")
    ) {
      return {
        success: false,
        destination,
        error: "Repository not found. Ensure eniem-dev/eniem-boilerplate exists and you have SSH access.",
      };
    }

    // Handle directory already exists
    if (errorMessage.includes("already exists")) {
      return {
        success: false,
        destination,
        error: `Directory "${projectName}" already exists. Choose a different name or remove the existing directory.`,
      };
    }

    // Handle network errors
    if (
      errorMessage.includes("ENOTFOUND") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("Could not resolve hostname")
    ) {
      return {
        success: false,
        destination,
        error: "Network error: Unable to connect to GitHub. Check your internet connection.",
      };
    }

    return {
      success: false,
      destination,
      error: `Failed to clone repository: ${errorMessage}`,
    };
  }
}
