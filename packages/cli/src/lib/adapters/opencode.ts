import { execa } from "execa";
import type { CLIAdapter, CLIResult, CLIRunner, RunOptions } from "./types.js";

const SENTINEL = ":::ENI_DONE:::";

export const opencodeAdapter: CLIAdapter = {
  name: "OpenCode",
  id: "opencode",
  binary: "opencode",

  run(prompt: string, options: RunOptions = {}): CLIRunner {
    const { onText, onToolUse, cwd, args = [] } = options;
    let lastText = "";
    let buffer = "";

    let stderrBuf = "";

    const subprocess = execa(
      "opencode",
      ["run", prompt, "--format", "json", "-q", ...args],
      { cwd },
    );

    subprocess.stderr?.on("data", (chunk: Buffer) => {
      stderrBuf += chunk.toString();
    });

    function processLine(line: string): void {
      if (!line.trim()) return;

      try {
        const event = JSON.parse(line) as {
          type?: string;
          part?: {
            text?: string;
            tool?: string;
            state?: { input?: Record<string, unknown> };
          };
        };

        if (event.type === "text") {
          lastText = event.part?.text ?? "";
          onText?.(lastText);
        } else if (event.type === "tool_use") {
          onToolUse?.(
            event.part?.tool ?? "",
            event.part?.state?.input ?? {},
          );
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
            "OpenCode CLI not found. Install it with: curl -fsSL https://opencode.ai/install | bash",
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
