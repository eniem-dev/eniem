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
