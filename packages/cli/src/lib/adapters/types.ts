export const SUPPORTED_CLIS = ["claude", "codex", "gemini", "opencode"] as const;

export type CLIId = (typeof SUPPORTED_CLIS)[number];

export interface RunOptions {
  onText?: (text: string) => void;
  onToolUse?: (name: string, input: Record<string, unknown>) => void;
  cwd?: string;
  args?: string[];
}

export interface CLIResult {
  exitCode: number;
  sentinelDetected: boolean;
  stderr: string;
}

export interface CLIRunner {
  result: Promise<CLIResult>;
  kill: () => void;
}

export interface CLIAdapter {
  name: string;
  id: CLIId;
  binary: string;
  run: (prompt: string, options?: RunOptions) => CLIRunner;
}
