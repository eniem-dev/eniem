import { execa } from "execa";

export interface InstallOptions {
  destination: string;
  onProgress?: (message: string) => void;
}

export interface InstallResult {
  success: boolean;
  error?: string;
}

export async function runPnpmInstall({
  destination,
  onProgress,
}: InstallOptions): Promise<InstallResult> {
  try {
    onProgress?.("Installing dependencies with pnpm...");

    await execa("pnpm", ["install"], {
      cwd: destination,
      stdio: "pipe",
    });

    onProgress?.("Dependencies installed successfully!");

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    if (errorMessage.includes("ENOENT")) {
      return {
        success: false,
        error: "pnpm command not found. Please install pnpm and try again.",
      };
    }

    if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("ENOTFOUND")) {
      return {
        success: false,
        error: "Network error. Please check your internet connection and try again.",
      };
    }

    return {
      success: false,
      error: `Failed to install dependencies: ${errorMessage}`,
    };
  }
}
