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
    .filter(
      (entry) =>
        extname(entry) === ".md" &&
        basename(entry, ".md").toLowerCase() !== "readme",
    )
    .map((entry) => ({
      name: basename(entry, ".md"),
      path: join(dir, entry),
    }));
}

/**
 * Moves a spec file to the target directory, creating it if needed.
 */
/**
 * Sorts specs by leading numeric prefix (ascending), unnumbered specs after.
 */
export function sortByNumericPrefix(specs: SpecFile[]): SpecFile[] {
  return [...specs].sort((a, b) => {
    const numA = parseInt(a.name.match(/^(\d+)/)?.[1] ?? "", 10);
    const numB = parseInt(b.name.match(/^(\d+)/)?.[1] ?? "", 10);
    const hasA = !isNaN(numA);
    const hasB = !isNaN(numB);
    if (hasA && hasB) return numA - numB;
    if (hasA) return -1;
    if (hasB) return 1;
    return a.name.localeCompare(b.name);
  });
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
