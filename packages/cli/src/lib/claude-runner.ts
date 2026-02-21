import { execa } from "execa";

export interface RunClaudeOptions {
  onText?: (text: string) => void;
  onToolUse?: (toolName: string, toolInput: Record<string, unknown>) => void;
  cwd?: string;
  args?: string[];
}

export interface ClaudeResult {
  exitCode: number;
  sentinelDetected: boolean;
}

export interface ClaudeRunner {
  result: Promise<ClaudeResult>;
  kill: () => void;
}

const SENTINEL = ":::ENI_DONE:::";

export async function checkBinary(name: string): Promise<boolean> {
  try {
    await execa(name, ["--version"]);
    return true;
  } catch (err: unknown) {
    const error = err as { code?: string };
    return error.code !== "ENOENT";
  }
}

export function runClaude(
  prompt: string,
  options: RunClaudeOptions = {},
): ClaudeRunner {
  const { onText, onToolUse, cwd, args = [] } = options;
  let sentinelDetected = false;
  let buffer = "";

  const subprocess = execa(
    "claude",
    ["--output-format", "stream-json", "--verbose", "--print", "--dangerously-skip-permissions", "-p", prompt, ...args],
    { cwd },
  );

  function processLine(line: string): void {
    if (!line.trim()) return;

    try {
      const event = JSON.parse(line);

      if (event.type === "assistant") {
        const content = event.message?.content ?? [];
        for (const block of content) {
          if (block.type === "text") {
            if (block.text.includes(SENTINEL)) sentinelDetected = true;
            onText?.(block.text);
          } else if (block.type === "tool_use") {
            onToolUse?.(block.name, block.input ?? {});
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

  const result = (async (): Promise<ClaudeResult> => {
    try {
      await subprocess;
      if (buffer.trim()) processLine(buffer);
      return { exitCode: 0, sentinelDetected };
    } catch (error: unknown) {
      if (buffer.trim()) processLine(buffer);
      const err = error as { code?: string; exitCode?: number };

      if (err.code === "ENOENT") {
        throw new Error(
          "Claude CLI not found. Install it with: npm install -g @anthropic-ai/claude-code",
        );
      }

      if (typeof err.exitCode === "number") {
        return { exitCode: err.exitCode, sentinelDetected };
      }

      throw error;
    }
  })();

  return { result, kill: () => subprocess.kill("SIGTERM") };
}
