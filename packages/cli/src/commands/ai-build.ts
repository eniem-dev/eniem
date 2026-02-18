import * as path from "path";
import { execa } from "execa";
import {
  runPreflight,
  printPreflightErrors,
} from "../lib/preflight.js";
import { runLoop } from "../lib/loop-engine.js";
import { createRenderer } from "../lib/loop-renderer.js";

const DEFAULT_ITERATIONS = 10;
const PROMPT_FILE = ".eni/PROMPT_build.md";

export interface AiBuildOptions {
  epicName?: string;
  iterations?: number;
  debug: boolean;
  cwd: string;
}

/**
 * Check if there are ready tasks in beads, optionally filtered by epic name.
 * Returns true if tasks exist, false otherwise.
 */
export async function hasReadyTasks(
  cwd: string,
  epicName?: string,
): Promise<boolean> {
  let stdout: string;
  try {
    const result = await execa("bd", ["ready"], { cwd });
    stdout = result.stdout;
  } catch {
    return false;
  }

  if (!stdout.trim()) return false;

  const lines = stdout.split("\n");
  const taskLines = lines.filter((line) => line.match(/\[.*\]\s+\w+-\w+:/));

  if (epicName) {
    return taskLines.some((line) =>
      line.toLowerCase().includes(epicName.toLowerCase()),
    );
  }

  return taskLines.length > 0;
}

/**
 * Run the `eni ai build` command.
 *
 * Checks for ready tasks, runs pre-flight checks, then invokes the loop engine.
 */
export async function runAiBuild(opts: AiBuildOptions): Promise<void> {
  const { debug, cwd } = opts;
  const maxIterations = opts.iterations ?? DEFAULT_ITERATIONS;

  // Validate iteration count
  if (maxIterations < 1) {
    console.error("\x1b[31mError: iteration count must be at least 1\x1b[0m");
    process.exit(1);
    return undefined as never;
  }

  // Run pre-flight checks
  const errors = await runPreflight(cwd, { promptFile: PROMPT_FILE });
  if (errors.length > 0) {
    printPreflightErrors(errors);
    process.exit(1);
    return undefined as never;
  }

  // Check for ready tasks
  const ready = await hasReadyTasks(cwd, opts.epicName);
  if (!ready) {
    console.log(
      "No ready tasks. Run `eni ai plan` first or check: `bd blocked`",
    );
    process.exit(0);
    return undefined as never;
  }

  // Run the build loop
  const renderer = createRenderer({ debug, maxIterations });

  await runLoop({
    promptFile: path.join(cwd, PROMPT_FILE),
    maxIterations,
    templateVars: { epicName: opts.epicName },
    cwd,
    ...renderer.callbacks,
    onLoopComplete: renderer.onLoopComplete,
    onSigint: renderer.onSigint,
  });

  renderer.cleanup();
}
