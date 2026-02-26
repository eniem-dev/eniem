import { execa } from "execa";
import type { CLIAdapter, CLIResult, CLIRunner, RunOptions } from "./types.js";

const SENTINEL = ":::ENI_DONE:::";

export const codexAdapter: CLIAdapter = {
  name: "Codex",
  id: "codex",
  binary: "codex",

  run(prompt: string, options: RunOptions = {}): CLIRunner {
    const { onText, onToolUse, cwd, args = [] } = options;
    let lastText = "";
    let buffer = "";

    let stderrBuf = "";

    const subprocess = execa(
      "codex",
      ["exec", prompt, "--json", "--yolo", ...args],
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
          item?: {
            type?: string;
            text?: string;
            command?: string;
            file_path?: string;
            tool_name?: string;
            [key: string]: unknown;
          };
        };

        if (!event.item) return;

        const itemType = event.item.type;

        if (itemType === "agent_message") {
          lastText = event.item.text ?? "";
          onText?.(lastText);
        } else if (itemType === "command_execution") {
          const raw = event.item.command ?? "";
          // Strip shell wrapper (e.g. "/bin/zsh -lc 'actual command'")
          const match = raw.match(/-lc\s+'(.+)'$/);
          const command = match ? match[1] : raw;
          onToolUse?.("bash", { command });
        } else if (
          itemType === "file_change" ||
          itemType === "mcp_tool_call"
        ) {
          const name = event.item.tool_name ?? itemType;
          const input = Object.fromEntries(
            Object.entries(event.item).filter(([k]) => k !== "type"),
          );
          onToolUse?.(name, input);
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
            "Codex CLI not found. Install it with: npm install -g @openai/codex",
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
