import { readFile } from "fs/promises";

export interface TemplateVars {
  [key: string]: string;
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
