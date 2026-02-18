import ora, { type Ora } from "ora";
import type { LoopConfig } from "./types.js";
import { SENTINELS } from "./types.js";

/**
 * Format elapsed milliseconds as "Xm Ys" or "Xs".
 */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Format a tool_use event for debug display.
 *
 * Format: `  → ToolName: key_input`
 */
export function formatToolCall(name: string, info: string): string {
  return `  \u2192 ${name}: ${info}`;
}

export interface RendererOptions {
  debug: boolean;
  maxIterations: number;
}

/**
 * Create the LoopConfig event callbacks that render loop output
 * to the terminal: spinner while Claude works, streaming text,
 * iteration headers/footers, and optional debug tool call display.
 *
 * Returns a partial LoopConfig with the callback fields set,
 * plus a cleanup function and a SIGINT handler.
 */
export function createRenderer(options: RendererOptions): {
  callbacks: Pick<
    LoopConfig,
    "onText" | "onToolUse" | "onIterationStart" | "onIterationEnd"
  >;
  onLoopComplete: (sentinel: string | null) => void;
  onSigint: (iteration: number, totalElapsed: number) => void;
  cleanup: () => void;
} {
  let spinner: Ora | null = null;

  function ensureSpinnerStopped(): void {
    if (spinner) {
      spinner.stop();
      spinner = null;
    }
  }

  function ensureSpinnerRunning(): void {
    if (!spinner) {
      spinner = ora({ spinner: "dots" }).start();
    }
  }

  const callbacks: Pick<
    LoopConfig,
    "onText" | "onToolUse" | "onIterationStart" | "onIterationEnd"
  > = {
    onIterationStart(iteration: number, total: number): void {
      process.stdout.write(`--- Iteration ${iteration} of ${total} ---\n`);
      ensureSpinnerRunning();
    },

    onIterationEnd(iteration: number, elapsed: number): void {
      ensureSpinnerStopped();
      process.stdout.write(
        `--- Iteration ${iteration} of ${options.maxIterations} (${formatElapsed(elapsed)}) ---\n`,
      );
    },

    onText(text: string): void {
      ensureSpinnerStopped();
      process.stdout.write(text + "\n");
      ensureSpinnerRunning();
    },

    onToolUse(name: string, info: string): void {
      if (options.debug) {
        ensureSpinnerStopped();
        process.stdout.write(formatToolCall(name, info) + "\n");
        ensureSpinnerRunning();
      }
      // Default mode: tool calls hidden
    },
  };

  function onLoopComplete(sentinel: string | null): void {
    ensureSpinnerStopped();
    if (sentinel === SENTINELS.PLAN_REFINED) {
      process.stdout.write("=== Plan Complete ===\n");
    } else if (sentinel === SENTINELS.ALL_TASKS_COMPLETE) {
      process.stdout.write("=== All Tasks Complete ===\n");
    }
  }

  function onSigint(iteration: number, totalElapsed: number): void {
    ensureSpinnerStopped();
    process.stdout.write(
      `\nInterrupted after iteration ${iteration} of ${options.maxIterations} (${formatElapsed(totalElapsed)} elapsed).\n`,
    );
  }

  function cleanup(): void {
    ensureSpinnerStopped();
  }

  return { callbacks, onLoopComplete, onSigint, cleanup };
}
