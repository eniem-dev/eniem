import * as path from "path";
import {
  runPreflight,
  printPreflightErrors,
  listUnplannedSpecs,
} from "../lib/preflight.js";
import { runLoop } from "../lib/loop-engine.js";
import { createRenderer } from "../lib/loop-renderer.js";

const DEFAULT_ITERATIONS = 3;
const PROMPT_FILE = ".eni/PROMPT_plan.md";

export interface AiPlanOptions {
  specName?: string;
  iterations?: number;
  debug: boolean;
  cwd: string;
}

/**
 * Run the `eni ai plan` command.
 *
 * If specName is provided, runs the loop directly.
 * If not, shows an interactive spec selector (via Ink, handled by the caller).
 *
 * Returns { needsSelector: true, specs: string[] } when interactive selection is needed.
 * Returns { needsSelector: false } after running the loop to completion.
 */
export async function runAiPlan(
  opts: AiPlanOptions,
): Promise<{ needsSelector: true; specs: string[] } | { needsSelector: false }> {
  const { debug, cwd } = opts;
  const maxIterations = opts.iterations ?? DEFAULT_ITERATIONS;

  // Validate iteration count
  if (maxIterations < 1) {
    console.error("\x1b[31mError: iteration count must be at least 1\x1b[0m");
    process.exit(1);
    return undefined as never;
  }

  // If no spec name given, find unplanned specs for selector
  if (!opts.specName) {
    // Run minimal preflight (no spec file check)
    const errors = await runPreflight(cwd, { promptFile: PROMPT_FILE });
    if (errors.length > 0) {
      printPreflightErrors(errors);
      process.exit(1);
      return undefined as never;
    }

    const unplanned = await listUnplannedSpecs(cwd);
    if (unplanned.length === 0) {
      console.log("No unplanned specs found.");
      process.exit(0);
      return undefined as never;
    }

    return { needsSelector: true, specs: unplanned };
  }

  // Run full preflight with spec file check
  const errors = await runPreflight(cwd, {
    promptFile: PROMPT_FILE,
    specFile: opts.specName,
  });
  if (errors.length > 0) {
    printPreflightErrors(errors);
    process.exit(1);
    return undefined as never;
  }

  // Run the loop
  await executePlanLoop(opts.specName, maxIterations, debug, cwd);
  return { needsSelector: false };
}

/**
 * Execute the plan loop for a given spec. Called after selection or directly.
 */
export async function executePlanLoop(
  specName: string,
  maxIterations: number,
  debug: boolean,
  cwd: string,
): Promise<void> {
  const renderer = createRenderer({ debug, maxIterations });

  await runLoop({
    promptFile: path.join(cwd, PROMPT_FILE),
    maxIterations,
    templateVars: { specName },
    cwd,
    ...renderer.callbacks,
    onLoopComplete: renderer.onLoopComplete,
    onSigint: renderer.onSigint,
  });

  renderer.cleanup();
}
