import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";
import { claudeAdapter } from "../claude.js";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

import { execa } from "execa";

function createMockSubprocess(
  options: {
    stdoutLines?: string[];
    exitCode?: number;
    error?: Error & { code?: string; exitCode?: number };
  } = {},
) {
  const stdout = new EventEmitter();
  const stderr = new EventEmitter();
  const killFn = vi.fn();

  let resolve: (value: unknown) => void;
  let reject: (reason: unknown) => void;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const subprocess = Object.assign(promise, {
    stdout,
    stderr,
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

describe("claude adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("has correct metadata", () => {
    expect(claudeAdapter.name).toBe("Claude Code");
    expect(claudeAdapter.id).toBe("claude");
    expect(claudeAdapter.binary).toBe("claude");
  });

  it("spawns claude with correct arguments", async () => {
    const mock = createMockSubprocess();
    vi.mocked(execa).mockReturnValue(mock as never);

    const runner = claudeAdapter.run("build the thing", {
      args: ["--extra"],
      cwd: "/test",
    });

    expect(execa).toHaveBeenCalledWith(
      "claude",
      [
        "--dangerously-skip-permissions",
        "-p",
        "--verbose",
        "--output-format",
        "stream-json",
        "--extra",
      ],
      { cwd: "/test", input: "build the thing" },
    );

    await runner.result;
  });

  it("parses text events and calls onText callback", async () => {
    const textEvent = JSON.stringify({
      type: "assistant",
      message: { content: [{ type: "text", text: "Hello world" }] },
    });

    const mock = createMockSubprocess({ stdoutLines: [textEvent] });
    vi.mocked(execa).mockReturnValue(mock as never);

    const onText = vi.fn();
    const runner = claudeAdapter.run("test prompt", { onText });
    const result = await runner.result;

    expect(onText).toHaveBeenCalledWith("Hello world");
    expect(result.exitCode).toBe(0);
  });

  it("parses tool_use events and calls onToolUse callback", async () => {
    const toolEvent = JSON.stringify({
      type: "assistant",
      message: {
        content: [
          { type: "tool_use", name: "Read", input: { file_path: "/test.ts" } },
        ],
      },
    });

    const mock = createMockSubprocess({ stdoutLines: [toolEvent] });
    vi.mocked(execa).mockReturnValue(mock as never);

    const onToolUse = vi.fn();
    const runner = claudeAdapter.run("test prompt", { onToolUse });
    await runner.result;

    expect(onToolUse).toHaveBeenCalledWith("Read", { file_path: "/test.ts" });
  });

  it("detects sentinel in output", async () => {
    const textEvent = JSON.stringify({
      type: "assistant",
      message: { content: [{ type: "text", text: "Done :::ENI_DONE:::" }] },
    });

    const mock = createMockSubprocess({ stdoutLines: [textEvent] });
    vi.mocked(execa).mockReturnValue(mock as never);

    const runner = claudeAdapter.run("test prompt");
    const result = await runner.result;

    expect(result.sentinelDetected).toBe(true);
  });

  it("returns non-zero exitCode on failure", async () => {
    const error = Object.assign(new Error("Process failed"), { exitCode: 1 });
    const mock = createMockSubprocess({ error });
    vi.mocked(execa).mockReturnValue(mock as never);

    const runner = claudeAdapter.run("test prompt");
    const result = await runner.result;

    expect(result.exitCode).toBe(1);
  });

  it("kill() sends SIGTERM", async () => {
    const mock = createMockSubprocess();
    vi.mocked(execa).mockReturnValue(mock as never);

    const runner = claudeAdapter.run("test prompt");
    runner.kill();

    expect(mock.kill).toHaveBeenCalledWith("SIGTERM");
    await runner.result;
  });

  it("throws descriptive error when binary not found (ENOENT)", async () => {
    const error = Object.assign(new Error("spawn claude ENOENT"), {
      code: "ENOENT",
    });
    const mock = createMockSubprocess({ error });
    vi.mocked(execa).mockReturnValue(mock as never);

    const runner = claudeAdapter.run("test prompt");

    await expect(runner.result).rejects.toThrow("Claude CLI not found");
  });

  it("skips non-JSON lines gracefully", async () => {
    const validEvent = JSON.stringify({
      type: "assistant",
      message: { content: [{ type: "text", text: "Valid" }] },
    });

    const mock = createMockSubprocess({
      stdoutLines: ["not-json", validEvent, "also-not-json"],
    });
    vi.mocked(execa).mockReturnValue(mock as never);

    const onText = vi.fn();
    const runner = claudeAdapter.run("test prompt", { onText });
    await runner.result;

    expect(onText).toHaveBeenCalledTimes(1);
    expect(onText).toHaveBeenCalledWith("Valid");
  });
});
