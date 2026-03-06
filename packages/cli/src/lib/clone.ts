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
}

export function buildSshUrl(gitHost: string): string {
  return `git@${gitHost}:${BOILERPLATE_REPO_PATH}`;
}

export function buildHttpsUrl(gitHost: string): string {
  return `https://${gitHost}/${BOILERPLATE_REPO_PATH}`;
}

async function cloneWithUrl(
  url: string,
  destination: string,
): Promise<void> {
  await execa("git", ["clone", "--depth", "1", url, destination], {
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
}

export async function cloneBoilerplate({
  projectName,
  gitHost,
  protocol,
  onProgress,
}: CloneOptions): Promise<CloneResult> {
  const destination = `./${projectName}`;
  const useSsh = protocol === "ssh";
  const url = useSsh ? buildSshUrl(gitHost) : buildHttpsUrl(gitHost);

  onProgress?.(useSsh ? "Cloning boilerplate via SSH..." : "Cloning boilerplate repository...");

  try {
    await cloneWithUrl(url, destination);
    onProgress?.("Clone complete!");
    return { success: true, destination };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    if (errorMessage.includes("ENOENT")) {
      return {
        success: false,
        destination,
        error: "Git is not installed. Please install git and try again.",
      };
    }

    if (errorMessage.includes("already exists")) {
      return {
        success: false,
        destination,
        error: `Directory "${projectName}" already exists. Choose a different name or remove the existing directory.`,
      };
    }

    return {
      success: false,
      destination,
      error: `Failed to clone repository: ${errorMessage}`,
    };
  }
}
