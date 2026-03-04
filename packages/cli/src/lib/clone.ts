import { execa } from "execa";
import { BOILERPLATE_REPO_PATH } from "./constants.js";

export type Protocol = "ssh" | "https";

export interface CloneOptions {
  projectName: string;
  gitHost: string;
  protocol?: Protocol;
  onProgress?: (message: string) => void;
}

export interface CloneResult {
  success: boolean;
  destination: string;
  error?: string;
  fallbackUsed?: boolean;
}

export const SSH_TIMEOUT_MS = 10_000;

export function buildSshUrl(gitHost: string): string {
  return `git@${gitHost}:${BOILERPLATE_REPO_PATH}`;
}

export function buildHttpsUrl(gitHost: string): string {
  return `https://${gitHost}/${BOILERPLATE_REPO_PATH}`;
}

export function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  const timedOut = (error as { timedOut?: boolean }).timedOut === true;

  return (
    timedOut ||
    message.includes("ENOTFOUND") ||
    message.includes("ECONNREFUSED") ||
    message.includes("Could not resolve hostname") ||
    message.includes("Connection refused")
  );
}

export function isAuthError(message: string): boolean {
  return (
    message.includes("Permission denied") ||
    message.includes("Could not read from remote repository") ||
    message.includes("Repository not found") ||
    message.includes("does not exist")
  );
}

async function cloneWithUrl(
  url: string,
  destination: string,
  timeout?: number,
): Promise<void> {
  await execa("git", ["clone", "--depth", "1", url, destination], {
    ...(timeout ? { timeout } : {}),
  });
}

function handleNonNetworkError(
  error: unknown,
  projectName: string,
  destination: string,
): CloneResult | null {
  const errorMessage =
    error instanceof Error ? error.message : "Unknown error occurred";

  if (errorMessage.includes("ENOENT")) {
    return {
      success: false,
      destination,
      error: "Git is not installed. Please install git and try again.",
    };
  }

  if (isAuthError(errorMessage)) {
    if (
      errorMessage.includes("Permission denied") ||
      errorMessage.includes("Could not read from remote repository")
    ) {
      return {
        success: false,
        destination,
        error:
          "SSH access denied. Ensure your SSH key has access to eniem-dev/eniem-boilerplate.",
      };
    }
    return {
      success: false,
      destination,
      error:
        "Repository not found. Ensure eniem-dev/eniem-boilerplate exists and you have SSH access.",
    };
  }

  if (errorMessage.includes("already exists")) {
    return {
      success: false,
      destination,
      error: `Directory "${projectName}" already exists. Choose a different name or remove the existing directory.`,
    };
  }

  return null;
}

export async function cloneBoilerplate({
  projectName,
  gitHost,
  protocol,
  onProgress,
}: CloneOptions): Promise<CloneResult> {
  const destination = `./${projectName}`;

  // Explicit HTTPS: skip SSH entirely
  if (protocol === "https") {
    onProgress?.("Cloning boilerplate via HTTPS...");
    try {
      await cloneWithUrl(buildHttpsUrl(gitHost), destination);
      onProgress?.("Clone complete!");
      return { success: true, destination };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        destination,
        error: `Failed to clone repository: ${errorMessage}`,
      };
    }
  }

  // Explicit SSH: no fallback
  if (protocol === "ssh") {
    onProgress?.("Cloning boilerplate repository...");
    try {
      await cloneWithUrl(buildSshUrl(gitHost), destination);
      onProgress?.("Clone complete!");
      return { success: true, destination };
    } catch (error) {
      return handleSshError(error, projectName, destination);
    }
  }

  // Default: SSH with HTTPS fallback on network errors
  onProgress?.("Cloning boilerplate repository...");
  try {
    await cloneWithUrl(buildSshUrl(gitHost), destination, SSH_TIMEOUT_MS);
    onProgress?.("Clone complete!");
    return { success: true, destination };
  } catch (sshError) {
    // Only fallback on network errors (timeout, connection refused, DNS)
    if (!isNetworkError(sshError)) {
      return handleSshError(sshError, projectName, destination);
    }

    // Attempt HTTPS fallback
    onProgress?.("SSH timed out, switching to HTTPS...");
    try {
      await cloneWithUrl(buildHttpsUrl(gitHost), destination);
      onProgress?.("Clone complete!");
      return { success: true, destination, fallbackUsed: true };
    } catch (httpsError) {
      const httpsMessage =
        httpsError instanceof Error
          ? httpsError.message
          : "Unknown error occurred";
      const sshReason = (sshError as { timedOut?: boolean }).timedOut
        ? "Timed out after 10s (port 22 may be blocked)"
        : sshError instanceof Error
          ? sshError.message
          : "Network error";

      return {
        success: false,
        destination,
        error: `Could not clone the repository\n\n  SSH:   ${sshReason}\n  HTTPS: ${httpsMessage}\n\nCheck your network connection and git credentials.`,
      };
    }
  }
}

function handleSshError(
  error: unknown,
  projectName: string,
  destination: string,
): CloneResult {
  const handled = handleNonNetworkError(error, projectName, destination);
  if (handled) return handled;

  const errorMessage =
    error instanceof Error ? error.message : "Unknown error occurred";

  if (isNetworkError(error)) {
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
