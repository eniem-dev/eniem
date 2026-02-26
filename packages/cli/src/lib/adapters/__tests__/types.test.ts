import { describe, expect, it } from "vitest";

import type { CLIAdapter, CLIId, CLIResult, CLIRunner, RunOptions } from "../types.js";
import { SUPPORTED_CLIS } from "../types.js";

describe("SUPPORTED_CLIS", () => {
  it("contains exactly 4 entries", () => {
    expect(SUPPORTED_CLIS).toHaveLength(4);
  });

  it("includes claude", () => {
    expect(SUPPORTED_CLIS).toContain("claude");
  });

  it("includes codex", () => {
    expect(SUPPORTED_CLIS).toContain("codex");
  });

  it("includes gemini", () => {
    expect(SUPPORTED_CLIS).toContain("gemini");
  });

  it("includes opencode", () => {
    expect(SUPPORTED_CLIS).toContain("opencode");
  });
});

describe("CLIId type", () => {
  it("accepts valid CLI identifiers", () => {
    const ids: CLIId[] = ["claude", "codex", "gemini", "opencode"];
    expect(ids).toHaveLength(4);
  });
});

describe("type contracts", () => {
  it("CLIAdapter satisfies the expected shape", () => {
    const adapter: CLIAdapter = {
      name: "Test CLI",
      id: "claude",
      binary: "claude",
      run: (_prompt: string, _options?: RunOptions): CLIRunner => ({
        result: Promise.resolve({ exitCode: 0, sentinelDetected: false, stderr: "" }),
        kill: () => {},
      }),
    };

    expect(adapter.name).toBe("Test CLI");
    expect(adapter.id).toBe("claude");
    expect(adapter.binary).toBe("claude");
    expect(typeof adapter.run).toBe("function");
  });

  it("CLIRunner resolves with CLIResult", async () => {
    const expected: CLIResult = { exitCode: 0, sentinelDetected: true, stderr: "" };
    const runner: CLIRunner = {
      result: Promise.resolve(expected),
      kill: () => {},
    };

    const result = await runner.result;
    expect(result.exitCode).toBe(0);
    expect(result.sentinelDetected).toBe(true);
  });

  it("RunOptions callbacks are invocable", () => {
    let textReceived = "";
    let toolReceived = "";

    const options: RunOptions = {
      onText: (text) => { textReceived = text; },
      onToolUse: (name) => { toolReceived = name; },
      cwd: "/tmp",
      args: ["--flag"],
    };

    options.onText!("hello");
    options.onToolUse!("Read", { file: "test.ts" });

    expect(textReceived).toBe("hello");
    expect(toolReceived).toBe("Read");
    expect(options.cwd).toBe("/tmp");
    expect(options.args).toEqual(["--flag"]);
  });
});
