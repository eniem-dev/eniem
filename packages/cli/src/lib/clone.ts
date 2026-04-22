import { execa } from "execa";
import { BOILERPLATE_REPO_PATH, BOILERPLATE_REPO_SLUG } from "./constants.js";

export interface CloneOptions {
  projectName: string;
  ssh?: boolean;
  gitHost?: string;
  onProgress?: (message: string) => void;
}

export interface CloneResult {
  success: boolean;
  destination: string;
  error?: string;
}

function buildSshUrl(gitHost: string): string {
  return `git@${gitHost}:${BOILERPLATE_REPO_PATH}`;
}

function buildHttpsUrl(): string {
  return `https://github.com/${BOILERPLATE_REPO_PATH}`;
}

async function runGit(args: string[]): Promise<void> {
  await execa("git", args, {
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
}

async function runGh(args: string[]): Promise<void> {
  await execa("gh", args);
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return "not installed";
    return error.message;
  }
  return "Unknown error";
}

function isAlreadyExists(error: unknown): boolean {
  return error instanceof Error && error.message.includes("already exists");
}

export async function cloneBoilerplate({
  projectName,
  ssh = false,
  gitHost,
  onProgress,
}: CloneOptions): Promise<CloneResult> {
  const destination = `./${projectName}`;

  if (ssh) {
    const host = gitHost ?? "github.com";
    onProgress?.("Cloning via SSH...");
    try {
      await runGit(["clone", "--depth", "1", buildSshUrl(host), destination]);
      onProgress?.("Clone complete!");
      return { success: true, destination };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return {
          success: false,
          destination,
          error: "Git is not installed. Please install git and try again.",
        };
      }
      if (isAlreadyExists(error)) {
        return {
          success: false,
          destination,
          error: `Directory "${projectName}" already exists. Choose a different name or remove the existing directory.`,
        };
      }
      return {
        success: false,
        destination,
        error: `Failed to clone repository: ${describeError(error)}`,
      };
    }
  }

  onProgress?.("Cloning with gh...");
  let ghError: unknown;
  try {
    await runGh([
      "repo",
      "clone",
      BOILERPLATE_REPO_SLUG,
      destination,
      "--",
      "--depth",
      "1",
    ]);
    onProgress?.("Clone complete!");
    return { success: true, destination };
  } catch (error) {
    ghError = error;
  }

  if (isAlreadyExists(ghError)) {
    return {
      success: false,
      destination,
      error: `Directory "${projectName}" already exists. Choose a different name or remove the existing directory.`,
    };
  }

  onProgress?.("Falling back to git HTTPS...");
  try {
    await runGit(["clone", "--depth", "1", buildHttpsUrl(), destination]);
    onProgress?.("Clone complete!");
    return { success: true, destination };
  } catch (gitError) {
    if (isAlreadyExists(gitError)) {
      return {
        success: false,
        destination,
        error: `Directory "${projectName}" already exists. Choose a different name or remove the existing directory.`,
      };
    }
    return {
      success: false,
      destination,
      error: `Failed to clone. Tried gh: ${describeError(ghError)}. Tried git HTTPS: ${describeError(gitError)}.`,
    };
  }
}
