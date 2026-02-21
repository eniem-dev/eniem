import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";
import { runClaude } from "../claude-runner.js";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

import { execa } from "execa";

function createMockSubprocess(options: {
  stdoutLines?: string[];
  exitCode?: number;
  error?: Error & { code?: string; exitCode?: number };
} = {}) {
  const stdout = new EventEmitter();
  const killFn = vi.fn();

  let resolve: (value: unknown) => void;
  let reject: (reason: unknown) => void;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const subprocess = Object.assign(promise, {
    stdout,
    kill: killFn,
  });

  process.nextTick(() => {
    if (options.stdoutLines) {
      const data = options.stdoutLines.join("\n") + "\n";
      stdout.emit("data", Buffer.from(data));
    }

    process.nextTick(() => {
      if (options.error) {
        reject(options.error);
      } else {
        resolve({ exitCode: options.exitCode ?? 0 });
      }
    });
  });

  return subprocess;
}

describe("claude-runner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("spawns claude with correct arguments", async () => {
    const mock = createMockSubprocess();
    vi.mocked(execa).mockReturnValue(mock as never);

    const runner = runClaude("build the thing", {
      args: ["--verbose"],
      cwd: "/test",
    });

    expect(execa).toHaveBeenCalledWith(
      "claude",
      [
        "--output-format",
        "stream-json",
        "--print",
        "--dangerously-skip-permissions",
        "-p",
        "build the thing",
        "--verbose",
      ],
      { cwd: "/test" },
    );

    await runner.result;
  });

  it("parses stream-json text events and calls onText", async () => {
    const textEvent = JSON.stringify({
      type: "assistant",
      message: { type: "text", text: "Hello world" },
    });

    const mock = createMockSubprocess({ stdoutLines: [textEvent] });
    vi.mocked(execa).mockReturnValue(mock as never);

    const onText = vi.fn();
    const runner = runClaude("test prompt", { onText });
    const result = await runner.result;

    expect(onText).toHaveBeenCalledWith("Hello world");
    expect(result.exitCode).toBe(0);
  });

  it("parses tool_use events and calls onToolUse", async () => {
    const toolEvent = JSON.stringify({
      type: "assistant",
      message: {
        type: "tool_use",
        name: "Read",
        input: { file_path: "/test.ts" },
      },
    });

    const mock = createMockSubprocess({ stdoutLines: [toolEvent] });
    vi.mocked(execa).mockReturnValue(mock as never);

    const onToolUse = vi.fn();
    const runner = runClaude("test prompt", { onToolUse });
    await runner.result;

    expect(onToolUse).toHaveBeenCalledWith("Read", { file_path: "/test.ts" });
  });

  it("detects sentinel in text output", async () => {
    const textEvent = JSON.stringify({
      type: "assistant",
      message: { type: "text", text: "Done :::ENI_DONE:::" },
    });

    const mock = createMockSubprocess({ stdoutLines: [textEvent] });
    vi.mocked(execa).mockReturnValue(mock as never);

    const runner = runClaude("test prompt");
    const result = await runner.result;

    expect(result.sentinelDetected).toBe(true);
  });

  it("sentinelDetected is false when no sentinel in output", async () => {
    const textEvent = JSON.stringify({
      type: "assistant",
      message: { type: "text", text: "Just a normal message" },
    });

    const mock = createMockSubprocess({ stdoutLines: [textEvent] });
    vi.mocked(execa).mockReturnValue(mock as never);

    const runner = runClaude("test prompt");
    const result = await runner.result;

    expect(result.sentinelDetected).toBe(false);
  });

  it("returns exitCode 0 on normal completion", async () => {
    const mock = createMockSubprocess({ exitCode: 0 });
    vi.mocked(execa).mockReturnValue(mock as never);

    const runner = runClaude("test prompt");
    const result = await runner.result;

    expect(result.exitCode).toBe(0);
    expect(result.sentinelDetected).toBe(false);
  });

  it("returns non-zero exitCode on failure", async () => {
    const error = Object.assign(new Error("Process failed"), { exitCode: 1 });
    const mock = createMockSubprocess({ error });
    vi.mocked(execa).mockReturnValue(mock as never);

    const runner = runClaude("test prompt");
    const result = await runner.result;

    expect(result.exitCode).toBe(1);
  });

  it("kill() sends SIGTERM to subprocess", async () => {
    const mock = createMockSubprocess();
    vi.mocked(execa).mockReturnValue(mock as never);

    const runner = runClaude("test prompt");
    runner.kill();

    expect(mock.kill).toHaveBeenCalledWith("SIGTERM");
    await runner.result;
  });

  it("throws descriptive error when claude binary not found", async () => {
    const error = Object.assign(new Error("spawn claude ENOENT"), {
      code: "ENOENT",
    });
    const mock = createMockSubprocess({ error });
    vi.mocked(execa).mockReturnValue(mock as never);

    const runner = runClaude("test prompt");

    await expect(runner.result).rejects.toThrow("Claude CLI not found");
  });

  it("handles multiple text events across chunks", async () => {
    const event1 = JSON.stringify({
      type: "assistant",
      message: { type: "text", text: "First" },
    });
    const event2 = JSON.stringify({
      type: "assistant",
      message: { type: "text", text: "Second" },
    });

    const mock = createMockSubprocess({ stdoutLines: [event1, event2] });
    vi.mocked(execa).mockReturnValue(mock as never);

    const onText = vi.fn();
    const runner = runClaude("test prompt", { onText });
    await runner.result;

    expect(onText).toHaveBeenCalledTimes(2);
    expect(onText).toHaveBeenCalledWith("First");
    expect(onText).toHaveBeenCalledWith("Second");
  });

  it("skips non-JSON lines gracefully", async () => {
    const validEvent = JSON.stringify({
      type: "assistant",
      message: { type: "text", text: "Valid" },
    });

    const mock = createMockSubprocess({
      stdoutLines: ["not-json", validEvent, "also-not-json"],
    });
    vi.mocked(execa).mockReturnValue(mock as never);

    const onText = vi.fn();
    const runner = runClaude("test prompt", { onText });
    await runner.result;

    expect(onText).toHaveBeenCalledTimes(1);
    expect(onText).toHaveBeenCalledWith("Valid");
  });
});
