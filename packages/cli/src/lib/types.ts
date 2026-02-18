/** Configuration for the loop engine */
export interface LoopConfig {
  /** Path to the prompt template file (e.g. .eni/PROMPT_plan.md) */
  promptFile: string;
  /** Maximum number of iterations to run */
  maxIterations: number;
  /** Template variables for substitution in the prompt */
  templateVars: {
    specName?: string;
    epicName?: string;
  };
  /** Working directory for Claude process */
  cwd: string;
  /** Event callbacks for rendering */
  onText?: (text: string) => void;
  onToolUse?: (name: string, input: string) => void;
  onIterationStart?: (iteration: number, total: number) => void;
  onIterationEnd?: (iteration: number, elapsed: number) => void;
  /** Called when the loop finishes (sentinel or max iterations reached) */
  onLoopComplete?: (sentinel: string | null) => void;
  /** Called when SIGINT interrupts the loop */
  onSigint?: (iteration: number, totalElapsed: number) => void;
}

/** Result of a single loop iteration */
export interface IterationResult {
  /** 1-based iteration number */
  iteration: number;
  /** Exit code from the Claude process */
  exitCode: number;
  /** Whether a sentinel was detected in output */
  sentinel: string | null;
  /** Duration in milliseconds */
  elapsed: number;
}

/** Sentinel strings that signal loop termination */
export const SENTINELS = {
  PLAN_REFINED: ":::ENI_PLAN_REFINED:::",
  ALL_TASKS_COMPLETE: ":::ENI_ALL_TASKS_COMPLETE:::",
} as const;

export type Sentinel = (typeof SENTINELS)[keyof typeof SENTINELS];

/** A parsed event from Claude's stream-json output */
export type StreamEvent =
  | { type: "assistant"; message: AssistantMessage }
  | { type: "result"; result: ResultMessage }
  | { type: "unknown"; raw: string };

export interface AssistantMessage {
  content: ContentBlock[];
}

export interface ResultMessage {
  content: ContentBlock[];
}

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; name: string; input: Record<string, unknown> };
