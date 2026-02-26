import { execa } from "execa";
import type { CLIAdapter, CLIResult, CLIRunner, RunOptions } from "./types.js";

const SENTINEL = ":::ENI_DONE:::";

export const claudeAdapter: CLIAdapter = {
  name: "Claude Code",
  id: "claude",
  binary: "claude",

  run(prompt: string, options: RunOptions = {}): CLIRunner {
    const { onText, onToolUse, cwd, args = [] } = options;
    let lastText = "";
    let buffer = "";

    let stderrBuf = "";

    const subprocess = execa(
      "claude",
      [
        "--dangerously-skip-permissions",
        "-p",
        "--verbose",
        "--output-format",
        "stream-json",
        ...args,
      ],
      { cwd, input: prompt },
    );

    subprocess.stderr?.on("data", (chunk: Buffer) => {
      stderrBuf += chunk.toString();
    });

    function processLine(line: string): void {
      if (!line.trim()) return;

      try {
        const event = JSON.parse(line) as {
          type?: string;
          message?: {
            content?: Array<{
              type: string;
              text?: string;
              name?: string;
              input?: Record<string, unknown>;
            }>;
          };
        };

        if (event.type === "assistant") {
          const content = event.message?.content ?? [];
          for (const block of content) {
            if (block.type === "text") {
              lastText = block.text ?? "";
              onText?.(lastText);
            } else if (block.type === "tool_use") {
              onToolUse?.(block.name ?? "", block.input ?? {});
            }
          }
        }
      } catch {
        // Skip non-JSON lines
      }
    }

    subprocess.stdout?.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        processLine(line);
      }
    });

    const result = (async (): Promise<CLIResult> => {
      try {
        await subprocess;
        if (buffer.trim()) processLine(buffer);
        return { exitCode: 0, sentinelDetected: lastText.includes(SENTINEL), stderr: stderrBuf };
      } catch (error: unknown) {
        if (buffer.trim()) processLine(buffer);
        const sentinelDetected = lastText.includes(SENTINEL);
        const err = error as { code?: string; exitCode?: number };

        if (err.code === "ENOENT") {
          throw new Error(
            "Claude CLI not found. Install it with: npm install -g @anthropic-ai/claude-code",
          );
        }

        if (typeof err.exitCode === "number") {
          return { exitCode: err.exitCode, sentinelDetected, stderr: stderrBuf };
        }

        throw error;
      }
    })();

    return { result, kill: () => subprocess.kill("SIGTERM") };
  },
};
