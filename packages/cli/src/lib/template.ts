import { readFile } from "fs/promises";

export interface TemplateVars {
  [key: string]: string;
}

/**
 * Generates a session ID in YYYYMMDD-HHmm format.
 */
export function generateSessionId(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

/**
 * Builds template variables for build-all session mode with shared worktree.
 */
export function buildSessionTemplateVars(
  specName: string,
  iteration: number,
  sessionBranch: string,
  sessionWorktree: string,
  isLastSpec: boolean,
): TemplateVars {
  return {
    SPEC_NAME: specName,
    ITERATION: String(iteration),
    EPIC_NAME: specName,
    BRANCH: sessionBranch,
    WORKTREE: sessionWorktree,
    IS_LAST_SPEC: String(isLastSpec),
    IS_EPIC: "true",
  };
}

/**
 * Reads a template file and returns its contents as a string.
 */
export async function loadTemplate(filePath: string): Promise<string> {
  return readFile(filePath, "utf-8");
}

/**
 * Replaces all {{KEY}} placeholders in a template string with values from vars.
 * Unreplaced placeholders are left as-is (opaque substitution).
 */
export function resolveTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return key in vars ? vars[key] : match;
  });
}

/**
 * Builds the full set of template variables for a given spec.
 */
export function buildTemplateVars(
  specName: string,
  iteration: number,
  _mode: "plan" | "build",
): TemplateVars {
  return {
    SPEC_NAME: specName,
    ITERATION: String(iteration),
    EPIC_NAME: specName,
    BRANCH: `feat/${specName}`,
    WORKTREE: `.worktrees/feat/${specName}`,
  };
}
