import { readdir, rename, mkdir } from "fs/promises";
import { join, basename, extname } from "path";

export interface SpecFile {
  name: string;
  path: string;
}

/**
 * Lists all .md spec files in the given directory.
 * Returns an empty array if the directory is empty or doesn't exist.
 */
export async function listSpecs(dir: string): Promise<SpecFile[]> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return [];
  }

  return entries
    .filter((entry) => extname(entry) === ".md")
    .map((entry) => ({
      name: basename(entry, ".md"),
      path: join(dir, entry),
    }));
}

/**
 * Parses a comma-separated --spec flag into deduplicated names,
 * preserving first-occurrence order.
 * Returns null if the input is empty or whitespace-only.
 */
export function parseSpecFlag(raw: string): string[] | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of trimmed.split(",")) {
    const name = part.trim();
    if (name !== "" && !seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }
  return result.length > 0 ? result : null;
}

/**
 * Validates that every name in `specNames` matches an available spec.
 * Returns the list of unrecognized names (empty if all valid).
 */
export function validateSpecNames(
  specNames: string[],
  available: SpecFile[],
): string[] {
  const validNames = new Set(available.map((s) => s.name));
  return specNames.filter((n) => !validNames.has(n));
}

/**
 * Moves a spec file to the target directory, creating it if needed.
 */
export async function moveSpec(
  specPath: string,
  targetDir: string,
): Promise<string> {
  await mkdir(targetDir, { recursive: true });
  const destination = join(targetDir, basename(specPath));
  await rename(specPath, destination);
  return destination;
}
