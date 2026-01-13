import { downloadTemplate } from "giget";

export interface CloneOptions {
  projectName: string;
  onProgress?: (message: string) => void;
}

export interface CloneResult {
  success: boolean;
  destination: string;
  error?: string;
}

const TEMPLATE_SOURCE = "github:eniem-dev/eniem-boilerplate";

export async function cloneBoilerplate({
  projectName,
  onProgress,
}: CloneOptions): Promise<CloneResult> {
  const destination = `./${projectName}`;

  onProgress?.("Cloning boilerplate repository...");

  try {
    await downloadTemplate(TEMPLATE_SOURCE, {
      dir: destination,
      force: false,
    });

    onProgress?.("Clone complete!");

    return {
      success: true,
      destination,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Handle common network errors
    if (
      errorMessage.includes("ENOTFOUND") ||
      errorMessage.includes("ECONNREFUSED")
    ) {
      return {
        success: false,
        destination,
        error: "Network error: Unable to connect to GitHub. Check your internet connection.",
      };
    }

    if (errorMessage.includes("404")) {
      return {
        success: false,
        destination,
        error: "Template repository not found. Please check if eniem-dev/eniem-boilerplate exists.",
      };
    }

    if (errorMessage.includes("EEXIST") || errorMessage.includes("already exists")) {
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
