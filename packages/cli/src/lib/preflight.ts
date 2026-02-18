import * as fs from "fs/promises";
import * as path from "path";
import { execa } from "execa";

export interface PreflightError {
  message: string;
  hint?: string;
}

/**
 * Check if a CLI tool is available in PATH.
 */
async function isInPath(command: string): Promise<boolean> {
  try {
    await execa("command", ["-v", command], { shell: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a path exists (file or directory).
 */
async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Run pre-flight checks shared by `eni ai plan` and `eni ai build`.
 *
 * Returns an array of errors. Empty array means all checks passed.
 */
export async function runPreflight(
  cwd: string,
  opts: {
    promptFile: string;
    specFile?: string;
  },
): Promise<PreflightError[]> {
  const errors: PreflightError[] = [];

  // 1. .eni/ directory
  if (!(await exists(path.join(cwd, ".eni")))) {
    errors.push({ message: "run `eni ai setup` first" });
    return errors;
  }

  // 2. specs/ directory (only for plan)
  if (opts.specFile !== undefined) {
    if (!(await exists(path.join(cwd, "specs")))) {
      errors.push({ message: "specs/ directory not found. Run `eni ai setup` first" });
      return errors;
    }
  }

  // 3. Specific spec file (if given)
  if (opts.specFile) {
    const specPath = path.join(cwd, "specs", `${opts.specFile}.md`);
    if (!(await exists(specPath))) {
      const available = await listAvailableSpecs(cwd);
      const listing =
        available.length > 0
          ? `\n  Available specs: ${available.join(", ")}`
          : "";
      errors.push({
        message: `specs/${opts.specFile}.md not found`,
        hint: listing,
      });
      return errors;
    }
  }

  // 4. claude CLI in PATH
  if (!(await isInPath("claude"))) {
    errors.push({
      message: "claude CLI not found",
      hint: "Install Claude Code: https://docs.anthropic.com/en/docs/claude-code",
    });
  }

  // 5. bd CLI in PATH
  if (!(await isInPath("bd"))) {
    errors.push({
      message: "bd CLI not found",
      hint: "Install beads: see project README",
    });
  }

  // 6. .beads/ directory
  if (!(await exists(path.join(cwd, ".beads")))) {
    errors.push({ message: "run `eni ai setup` first" });
  }

  // 7. AGENTS.md in project root
  if (!(await exists(path.join(cwd, "AGENTS.md")))) {
    errors.push({ message: "AGENTS.md not found in project root" });
  }

  // 8. Prompt file
  const promptPath = path.join(cwd, opts.promptFile);
  if (!(await exists(promptPath))) {
    errors.push({
      message: `${opts.promptFile} not found. Run \`eni ai setup\``,
    });
  }

  return errors;
}

/**
 * Format pre-flight errors for terminal output and exit.
 */
export function printPreflightErrors(errors: PreflightError[]): void {
  for (const err of errors) {
    console.error(`\x1b[31mError: ${err.message}\x1b[0m`);
    if (err.hint) {
      console.error(`\n  ${err.hint}`);
    }
    console.error();
  }
}

/**
 * List spec names (without .md) from specs/ directory, excluding archive/.
 */
export async function listAvailableSpecs(cwd: string): Promise<string[]> {
  const specsDir = path.join(cwd, "specs");
  try {
    const entries = await fs.readdir(specsDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".md") && e.name !== ".gitkeep")
      .map((e) => e.name.replace(/\.md$/, ""));
  } catch {
    return [];
  }
}

/**
 * List specs that don't already have a matching beads epic.
 * Returns spec names (without .md) that are unplanned.
 */
export async function listUnplannedSpecs(cwd: string): Promise<string[]> {
  const allSpecs = await listAvailableSpecs(cwd);
  if (allSpecs.length === 0) return [];

  // Get existing epics from beads
  let epicOutput = "";
  try {
    const result = await execa("bd", ["list", "--type=epic"], { cwd });
    epicOutput = result.stdout;
  } catch {
    // If bd fails, assume no epics exist
    return allSpecs;
  }

  // Filter out specs that have a matching epic (match by name in epic title)
  return allSpecs.filter((spec) => !epicOutput.includes(spec));
}
