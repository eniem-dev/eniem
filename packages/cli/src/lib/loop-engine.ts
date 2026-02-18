import { execa } from "execa";
import * as fs from "fs/promises";
import * as readline from "readline";
import type {
  LoopConfig,
  IterationResult,
  StreamEvent,
  ContentBlock,
} from "./types.js";
import { SENTINELS, type Sentinel } from "./types.js";

const PAUSE_MS = 2000;

/**
 * Substitute template variables in prompt content.
 * Replaces {{SPEC_NAME}}, {{ITERATION}}, and {{EPIC_NAME}}.
 */
export function substituteTemplate(
  content: string,
  vars: { specName?: string; epicName?: string; iteration: number },
): string {
  let result = content;
  result = result.replaceAll("{{SPEC_NAME}}", vars.specName ?? "");
  result = result.replaceAll("{{ITERATION}}", String(vars.iteration));
  result = result.replaceAll("{{EPIC_NAME}}", vars.epicName ?? "");
  return result;
}

/**
 * Parse a single line of stream-json output into a StreamEvent.
 */
export function parseStreamEvent(line: string): StreamEvent | null {
  try {
    const data = JSON.parse(line) as Record<string, unknown>;
    if (data.type === "assistant" && data.message) {
      return {
        type: "assistant",
        message: data.message as StreamEvent extends { type: "assistant" }
          ? StreamEvent["message"]
          : never,
      } as StreamEvent;
    }
    if (data.type === "result" && data.result) {
      return {
        type: "result",
        result: data.result as StreamEvent extends { type: "result" }
          ? StreamEvent["result"]
          : never,
      } as StreamEvent;
    }
    return { type: "unknown", raw: line };
  } catch {
    return null;
  }
}

/**
 * Summarize a tool_use input for debug display.
 */
function summarizeToolInput(input: Record<string, unknown>): string {
  const i = input;
  return (
    (i.file_path as string) ??
    (i.pattern as string) ??
    (typeof i.command === "string" ? i.command.slice(0, 60) : null) ??
    (i.query as string) ??
    (typeof i.content === "string" ? i.content.slice(0, 40) : null) ??
    Object.keys(i).join(", ")
  );
}

/**
 * Check if text contains a sentinel string.
 */
export function detectSentinel(text: string): Sentinel | null {
  for (const sentinel of Object.values(SENTINELS)) {
    if (text.includes(sentinel)) {
      return sentinel;
    }
  }
  return null;
}

/**
 * Run the Claude loop engine.
 *
 * Spawns Claude in stream-json mode for up to maxIterations,
 * parsing output for text and tool-use events, detecting sentinels,
 * and pausing between iterations.
 *
 * Returns an array of IterationResult objects.
 */
export async function runLoop(config: LoopConfig): Promise<IterationResult[]> {
  const results: IterationResult[] = [];
  const promptContent = await fs.readFile(config.promptFile, "utf-8");
  const loopStartTime = Date.now();
  let lastSentinel: Sentinel | null = null;

  for (let i = 1; i <= config.maxIterations; i++) {
    config.onIterationStart?.(i, config.maxIterations);
    const startTime = Date.now();

    const prompt = substituteTemplate(promptContent, {
      specName: config.templateVars.specName,
      epicName: config.templateVars.epicName,
      iteration: i,
    });

    const result = await runIteration(prompt, config);
    const elapsed = Date.now() - startTime;

    // SIGINT: report interruption and return
    if (result.exitCode === 130) {
      config.onSigint?.(i, Date.now() - loopStartTime);
      results.push({ iteration: i, exitCode: 130, sentinel: null, elapsed });
      return results;
    }

    const iterationResult: IterationResult = {
      iteration: i,
      exitCode: result.exitCode,
      sentinel: result.sentinel,
      elapsed,
    };

    config.onIterationEnd?.(i, elapsed);
    results.push(iterationResult);

    // Stop on non-zero exit code
    if (result.exitCode !== 0) {
      break;
    }

    // Stop on sentinel detection
    if (result.sentinel) {
      lastSentinel = result.sentinel;
      break;
    }

    // Pause between iterations (not after the last one)
    if (i < config.maxIterations) {
      await sleep(PAUSE_MS);
    }
  }

  config.onLoopComplete?.(lastSentinel);
  return results;
}

interface IterationOutput {
  exitCode: number;
  sentinel: Sentinel | null;
}

async function runIteration(
  prompt: string,
  config: LoopConfig,
): Promise<IterationOutput> {
  const controller = new AbortController();

  // Handle SIGINT: kill the Claude child process
  const sigintHandler = () => {
    controller.abort();
  };
  process.on("SIGINT", sigintHandler);

  try {
    const child = execa(
      "claude",
      [
        "--dangerously-skip-permissions",
        "-p",
        "--verbose",
        "--output-format",
        "stream-json",
      ],
      {
        cwd: config.cwd,
        input: prompt,
        cancelSignal: controller.signal,
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    let lastAssistantText = "";

    // Parse stream-json output line by line
    if (child.stdout) {
      const rl = readline.createInterface({ input: child.stdout });
      for await (const line of rl) {
        const event = parseStreamEvent(line);
        if (!event) continue;

        if (event.type === "assistant" || event.type === "result") {
          const message =
            event.type === "assistant" ? event.message : event.result;
          for (const block of message.content ?? []) {
            processContentBlock(block, config);
            if (block.type === "text") {
              lastAssistantText = block.text;
            }
          }
        }
      }
    }

    // Wait for process to complete
    const result = await child;
    const exitCode = result.exitCode ?? 0;
    const sentinel = detectSentinel(lastAssistantText);

    return { exitCode, sentinel };
  } catch (error: unknown) {
    // Handle abort (SIGINT)
    if (
      error instanceof Error &&
      "isCanceled" in error &&
      (error as { isCanceled: boolean }).isCanceled
    ) {
      return { exitCode: 130, sentinel: null };
    }
    // Handle non-zero exit code from execa
    if (
      error instanceof Error &&
      "exitCode" in error &&
      typeof (error as { exitCode: unknown }).exitCode === "number"
    ) {
      return {
        exitCode: (error as { exitCode: number }).exitCode,
        sentinel: null,
      };
    }
    throw error;
  } finally {
    process.removeListener("SIGINT", sigintHandler);
  }
}

function processContentBlock(block: ContentBlock, config: LoopConfig): void {
  if (block.type === "text") {
    config.onText?.(block.text);
  } else if (block.type === "tool_use") {
    const info = summarizeToolInput(block.input);
    config.onToolUse?.(block.name, info);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
