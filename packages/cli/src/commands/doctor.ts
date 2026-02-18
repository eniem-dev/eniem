import { execa } from "execa";
import fs from "node:fs/promises";

export interface DoctorCheck {
  name: string;
  passed: boolean;
  version?: string;
  fix: string;
}

async function checkCliTool(
  cmd: string,
  args: string[],
  name: string,
  fix: string,
): Promise<DoctorCheck> {
  try {
    const { stdout } = await execa(cmd, args);
    const version = stdout.trim().replace(/^v/, "");
    return { name, passed: true, version, fix };
  } catch {
    return { name, passed: false, fix };
  }
}

async function checkPath(
  path: string,
  name: string,
  fix: string,
): Promise<DoctorCheck> {
  try {
    await fs.access(path);
    return { name, passed: true, fix };
  } catch {
    return { name, passed: false, fix };
  }
}

async function isGitRepo(): Promise<boolean> {
  try {
    await execa("git", ["rev-parse", "--is-inside-work-tree"]);
    return true;
  } catch {
    return false;
  }
}

export async function runDoctor(): Promise<void> {
  const inRepo = await isGitRepo();

  const checks: DoctorCheck[] = [];

  // CLI tool checks (always run)
  checks.push(
    await checkCliTool("node", ["--version"], "Node.js", "Install Node.js: https://nodejs.org"),
  );
  checks.push(
    await checkCliTool("pnpm", ["--version"], "pnpm", "Install pnpm: npm install -g pnpm"),
  );
  checks.push(
    await checkCliTool("claude", ["--version"], "Claude CLI", "Install Claude Code: https://docs.anthropic.com/en/docs/claude-code"),
  );
  checks.push(
    await checkCliTool("bd", ["--version"], "bd (beads)", "Install beads: see project README"),
  );

  // Repo-specific checks
  if (inRepo) {
    checks.push(await checkPath(".beads", ".beads/ initialized", "Run: eni ai setup"));
    checks.push(await checkPath(".eni", ".eni/ directory", "Run: eni ai setup"));
    checks.push(await checkPath(".eni/PROMPT_plan.md", "PROMPT_plan.md", "Run: eni ai setup"));
    checks.push(await checkPath(".eni/PROMPT_build.md", "PROMPT_build.md", "Run: eni ai setup"));
    checks.push(await checkPath(".claude/settings.json", ".claude/settings.json", "Run: eni ai setup"));
    checks.push(await checkPath("AGENTS.md", "AGENTS.md", "Create AGENTS.md in project root"));
    checks.push(await checkPath(".env", ".env file", "Copy from .env.example: cp .env.example .env"));
    checks.push(await checkPath("specs", "specs/ directory", "Run: eni ai setup"));
  }

  // Print results
  console.log("");
  for (const check of checks) {
    if (check.passed) {
      const label = check.version ? `${check.name} ${check.version}` : check.name;
      console.log(`  \x1b[32m✓\x1b[0m ${label}`);
    } else {
      console.log(`  \x1b[31m✗\x1b[0m ${check.name} \x1b[2m— ${check.fix}\x1b[0m`);
    }
  }

  const total = checks.length;
  const passed = checks.filter((c) => c.passed).length;

  if (!inRepo) {
    console.log(`\n  \x1b[33mNot in a git repository — skipped repo-specific checks\x1b[0m`);
  }

  console.log(`\n  ${passed}/${total} checks passed\n`);

  if (passed < total) {
    process.exit(1);
  }
}
