import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatElapsed, formatToolCall, createRenderer } from "../loop-renderer.js";

describe("formatElapsed", () => {
  it("formats seconds only", () => {
    expect(formatElapsed(5000)).toBe("5s");
  });

  it("formats minutes and seconds", () => {
    expect(formatElapsed(134000)).toBe("2m 14s");
  });

  it("formats zero seconds", () => {
    expect(formatElapsed(0)).toBe("0s");
  });

  it("formats exactly one minute", () => {
    expect(formatElapsed(60000)).toBe("1m 0s");
  });

  it("rounds to nearest second", () => {
    expect(formatElapsed(2500)).toBe("3s");
  });
});

describe("formatToolCall", () => {
  it("formats Read with file_path", () => {
    expect(formatToolCall("Read", "src/auth.ts")).toBe(
      "  \u2192 Read: src/auth.ts",
    );
  });

  it("formats Bash with truncated command", () => {
    expect(formatToolCall("Bash", "pnpm turbo build --filter=eniem-cli")).toBe(
      "  \u2192 Bash: pnpm turbo build --filter=eniem-cli",
    );
  });

  it("formats Grep with pattern", () => {
    expect(formatToolCall("Grep", "authentication")).toBe(
      "  \u2192 Grep: authentication",
    );
  });
});

describe("createRenderer", () => {
  let stdoutWriteSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutWriteSpy.mockRestore();
  });

  it("prints text events to stdout", () => {
    const { callbacks, cleanup } = createRenderer({
      debug: false,
      maxIterations: 3,
    });

    callbacks.onIterationStart!(1, 3);
    callbacks.onText!("Hello world");
    cleanup();

    const output = stdoutWriteSpy.mock.calls.map((c) => c[0]).join("");
    expect(output).toContain("Hello world\n");
  });

  it("hides tool_use events in default mode", () => {
    const { callbacks, cleanup } = createRenderer({
      debug: false,
      maxIterations: 3,
    });

    callbacks.onIterationStart!(1, 3);
    callbacks.onToolUse!("Read", "src/auth.ts");
    cleanup();

    const output = stdoutWriteSpy.mock.calls.map((c) => c[0]).join("");
    expect(output).not.toContain("Read");
    expect(output).not.toContain("src/auth.ts");
  });

  it("shows tool_use events in debug mode", () => {
    const { callbacks, cleanup } = createRenderer({
      debug: true,
      maxIterations: 3,
    });

    callbacks.onIterationStart!(1, 3);
    callbacks.onToolUse!("Read", "src/auth.ts");
    cleanup();

    const output = stdoutWriteSpy.mock.calls.map((c) => c[0]).join("");
    expect(output).toContain("\u2192 Read: src/auth.ts");
  });

  it("formats debug tool calls for Bash with truncated command", () => {
    const { callbacks, cleanup } = createRenderer({
      debug: true,
      maxIterations: 3,
    });

    callbacks.onIterationStart!(1, 3);
    callbacks.onToolUse!("Bash", "pnpm turbo build --filter=eniem-cli");
    cleanup();

    const output = stdoutWriteSpy.mock.calls.map((c) => c[0]).join("");
    expect(output).toContain(
      "\u2192 Bash: pnpm turbo build --filter=eniem-cli",
    );
  });

  it("prints iteration header", () => {
    const { callbacks, cleanup } = createRenderer({
      debug: false,
      maxIterations: 3,
    });

    callbacks.onIterationStart!(1, 3);
    cleanup();

    const output = stdoutWriteSpy.mock.calls.map((c) => c[0]).join("");
    expect(output).toContain("--- Iteration 1 of 3 ---");
  });

  it("prints iteration footer with elapsed time", () => {
    const { callbacks, cleanup } = createRenderer({
      debug: false,
      maxIterations: 3,
    });

    callbacks.onIterationEnd!(1, 134000);
    cleanup();

    const output = stdoutWriteSpy.mock.calls.map((c) => c[0]).join("");
    expect(output).toContain("--- Iteration 1 of 3 (2m 14s) ---");
  });

  it("prints Plan Complete on PLAN_REFINED sentinel", () => {
    const { onLoopComplete } = createRenderer({
      debug: false,
      maxIterations: 3,
    });

    onLoopComplete(":::ENI_PLAN_REFINED:::");

    const output = stdoutWriteSpy.mock.calls.map((c) => c[0]).join("");
    expect(output).toContain("=== Plan Complete ===");
  });

  it("prints All Tasks Complete on ALL_TASKS_COMPLETE sentinel", () => {
    const { onLoopComplete } = createRenderer({
      debug: false,
      maxIterations: 10,
    });

    onLoopComplete(":::ENI_ALL_TASKS_COMPLETE:::");

    const output = stdoutWriteSpy.mock.calls.map((c) => c[0]).join("");
    expect(output).toContain("=== All Tasks Complete ===");
  });

  it("prints nothing on null sentinel (max iterations reached)", () => {
    const { onLoopComplete } = createRenderer({
      debug: false,
      maxIterations: 3,
    });

    onLoopComplete(null);

    const output = stdoutWriteSpy.mock.calls.map((c) => c[0]).join("");
    expect(output).not.toContain("===");
  });

  it("prints interruption summary on SIGINT", () => {
    const { onSigint } = createRenderer({
      debug: false,
      maxIterations: 10,
    });

    onSigint(2, 271000);

    const output = stdoutWriteSpy.mock.calls.map((c) => c[0]).join("");
    expect(output).toContain(
      "Interrupted after iteration 2 of 10 (4m 31s elapsed).",
    );
  });
});
