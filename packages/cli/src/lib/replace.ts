import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const SKIP_DIRS = new Set(["node_modules", ".git"]);
const SKIP_FILES = new Set(["pnpm-lock.yaml"]);

export interface ReplacePlaceholdersOptions {
  destination: string;
  slug: string;
  appName: string;
  onProgress?: (message: string) => void;
}

export interface ReplacePlaceholdersResult {
  success: boolean;
  filesModified: number;
  occurrences: number;
  error?: string;
}

function isBinary(buffer: Buffer): boolean {
  const checkLength = Math.min(buffer.length, 8192);
  for (let i = 0; i < checkLength; i++) {
    if (buffer[i] === 0) return true;
  }
  return false;
}

async function walkFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(entry.name)) continue;
      files.push(fullPath);
    }
  }

  return files;
}

export async function replacePlaceholders({
  destination,
  slug,
  appName,
  onProgress,
}: ReplacePlaceholdersOptions): Promise<ReplacePlaceholdersResult> {
  let filesModified = 0;
  let occurrences = 0;

  try {
    const files = await walkFiles(destination);

    for (const filePath of files) {
      try {
        const buffer = await readFile(filePath);

        if (isBinary(buffer)) continue;

        const original = buffer.toString("utf-8");

        // Replace MyApp first (longer match), then myapp
        let replaced = original.replaceAll("MyApp", appName);
        replaced = replaced.replaceAll("myapp", slug);

        if (replaced !== original) {
          const myAppCount = original.split("MyApp").length - 1;
          const myappCount = original.split("myapp").length - 1;
          occurrences += myAppCount + myappCount;
          filesModified++;

          await writeFile(filePath, replaced, "utf-8");
          onProgress?.(`Replaced placeholders in ${filePath}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        onProgress?.(`Warning: skipping ${filePath}: ${msg}`);
      }
    }

    return { success: true, filesModified, occurrences };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      filesModified,
      occurrences,
      error: `Failed to replace placeholders: ${errorMessage}`,
    };
  }
}
