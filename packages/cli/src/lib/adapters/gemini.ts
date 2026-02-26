import { execa } from "execa";
import type { CLIAdapter, CLIResult, CLIRunner, RunOptions } from "./types.js";

const SENTINEL = ":::ENI_DONE:::";

export const geminiAdapter: CLIAdapter = {
  name: "Gemini CLI",
  id: "gemini",
  binary: "gemini",

  run(prompt: string, options: RunOptions = {}): CLIRunner {
    const { onText, onToolUse, cwd, args = [] } = options;
    let lastText = "";
    let buffer = "";

    let stderrBuf = "";

    const subprocess = execa(
      "gemini",
      [
        "-p",
        prompt,
        "--output-format",
        "stream-json",
        "--yolo",
        ...args,
      ],
      { cwd, stdin: "ignore" },
    );

    subprocess.stderr?.on("data", (chunk: Buffer) => {
      stderrBuf += chunk.toString();
    });

    function processLine(line: string): void {
      if (!line.trim()) return;

      try {
        const event = JSON.parse(line) as {
          type?: string;
          text?: string;
          name?: string;
          input?: Record<string, unknown>;
        };

        if (event.type === "message") {
          lastText = event.text ?? "";
          onText?.(lastText);
        } else if (event.type === "tool_use") {
          onToolUse?.(event.name ?? "", event.input ?? {});
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
            "Gemini CLI not found. Install it with: npm install -g @google/gemini-cli",
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
