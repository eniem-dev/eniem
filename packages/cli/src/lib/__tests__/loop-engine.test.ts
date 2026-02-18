import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import {
  substituteTemplate,
  parseStreamEvent,
  detectSentinel,
  runLoop,
} from "../loop-engine.js";
import { SENTINELS } from "../types.js";
import type { LoopConfig } from "../types.js";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

import { execa } from "execa";
import { Readable } from "stream";

/**
 * Helper to mock execa returning a child process-like object
 * with a readable stdout stream and a promise that resolves on stream end.
 */
function mockExecaWith(lines: string[], exitCode = 0): void {
  const mockedExeca = vi.mocked(execa);
  mockedExeca.mockImplementation(
    // execa's return type is a complex ResultPromise generic —
    // we mock only the subset used by runLoop (stdout + awaitable)
    (() => {
      const stdout = new Readable({
        read() {
          for (const line of lines) {
            this.push(line + "\n");
          }
          this.push(null);
        },
      });

      if (exitCode !== 0) {
        const promise = new Promise((_resolve, reject) => {
          stdout.on("end", () => {
            const err = new Error("Process failed") as Error & {
              exitCode: number;
              isCanceled: boolean;
            };
            err.exitCode = exitCode;
            err.isCanceled = false;
            reject(err);
          });
        });
        return Object.assign(promise, {
          stdout,
          stderr: new Readable({
            read() {
              this.push(null);
            },
          }),
        });
      }

      const promise = new Promise((resolve) => {
        stdout.on("end", () => resolve({ exitCode: 0 }));
      });
      return Object.assign(promise, {
        stdout,
        stderr: new Readable({
          read() {
            this.push(null);
          },
        }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any,
  );
}

describe("substituteTemplate", () => {
  it("replaces all placeholders", () => {
    const template =
      "Spec: {{SPEC_NAME}}, Iter: {{ITERATION}}, Epic: {{EPIC_NAME}}";
    const result = substituteTemplate(template, {
      specName: "my-spec",
      epicName: "my-epic",
      iteration: 3,
    });
    expect(result).toBe("Spec: my-spec, Iter: 3, Epic: my-epic");
  });

  it("replaces multiple occurrences of the same placeholder", () => {
    const template = "{{SPEC_NAME}} and {{SPEC_NAME}} again";
    const result = substituteTemplate(template, {
      specName: "foo",
      iteration: 1,
    });
    expect(result).toBe("foo and foo again");
  });

  it("replaces missing specName with empty string", () => {
    const template = "Spec: {{SPEC_NAME}}";
    const result = substituteTemplate(template, { iteration: 1 });
    expect(result).toBe("Spec: ");
  });

  it("replaces missing epicName with empty string", () => {
    const template = "Epic: {{EPIC_NAME}}";
    const result = substituteTemplate(template, { iteration: 1 });
    expect(result).toBe("Epic: ");
  });
});

describe("parseStreamEvent", () => {
  it("parses assistant event with text content", () => {
    const line = JSON.stringify({
      type: "assistant",
      message: {
        content: [{ type: "text", text: "Hello world" }],
      },
    });
    const event = parseStreamEvent(line);
    expect(event).toEqual({
      type: "assistant",
      message: {
        content: [{ type: "text", text: "Hello world" }],
      },
    });
  });

  it("parses assistant event with tool_use content", () => {
    const line = JSON.stringify({
      type: "assistant",
      message: {
        content: [
          {
            type: "tool_use",
            name: "Read",
            input: { file_path: "/foo/bar.ts" },
          },
        ],
      },
    });
    const event = parseStreamEvent(line);
    expect(event).toEqual({
      type: "assistant",
      message: {
        content: [
          {
            type: "tool_use",
            name: "Read",
            input: { file_path: "/foo/bar.ts" },
          },
        ],
      },
    });
  });

  it("parses result event", () => {
    const line = JSON.stringify({
      type: "result",
      result: {
        content: [{ type: "text", text: "Done :::ENI_PLAN_REFINED:::" }],
      },
    });
    const event = parseStreamEvent(line);
    expect(event).toEqual({
      type: "result",
      result: {
        content: [{ type: "text", text: "Done :::ENI_PLAN_REFINED:::" }],
      },
    });
  });

  it("returns null for invalid JSON", () => {
    const event = parseStreamEvent("not json");
    expect(event).toBeNull();
  });

  it("returns unknown for unrecognized event types", () => {
    const line = JSON.stringify({ type: "system", data: {} });
    const event = parseStreamEvent(line);
    expect(event).toEqual({ type: "unknown", raw: line });
  });
});

describe("detectSentinel", () => {
  it("detects PLAN_REFINED sentinel", () => {
    const text = "Plan is done :::ENI_PLAN_REFINED:::";
    expect(detectSentinel(text)).toBe(SENTINELS.PLAN_REFINED);
  });

  it("detects ALL_TASKS_COMPLETE sentinel", () => {
    const text = "All done :::ENI_ALL_TASKS_COMPLETE:::";
    expect(detectSentinel(text)).toBe(SENTINELS.ALL_TASKS_COMPLETE);
  });

  it("returns null when no sentinel present", () => {
    const text = "Just some regular output text";
    expect(detectSentinel(text)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(detectSentinel("")).toBeNull();
  });
});

describe("runLoop", () => {
  let tempDir: string;
  let promptFile: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "loop-engine-test-"));
    promptFile = path.join(tempDir, "PROMPT_test.md");
    await fs.writeFile(
      promptFile,
      "Spec: {{SPEC_NAME}}, Iter: {{ITERATION}}, Epic: {{EPIC_NAME}}",
    );
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  function makeConfig(overrides: Partial<LoopConfig> = {}): LoopConfig {
    return {
      promptFile,
      maxIterations: 3,
      templateVars: { specName: "test-spec", epicName: "test-epic" },
      cwd: tempDir,
      ...overrides,
    };
  }

  it("runs the correct number of iterations", async () => {
    const lines = [
      JSON.stringify({
        type: "assistant",
        message: { content: [{ type: "text", text: "Working..." }] },
      }),
    ];
    mockExecaWith(lines);

    const config = makeConfig({ maxIterations: 2 });
    const results = await runLoop(config);

    expect(results).toHaveLength(2);
    expect(results[0].iteration).toBe(1);
    expect(results[1].iteration).toBe(2);
    expect(results.every((r) => r.exitCode === 0)).toBe(true);
  });

  it("stops early when sentinel is detected", async () => {
    const lines = [
      JSON.stringify({
        type: "assistant",
        message: {
          content: [
            { type: "text", text: "Done :::ENI_PLAN_REFINED:::" },
          ],
        },
      }),
    ];
    mockExecaWith(lines);

    const config = makeConfig({ maxIterations: 5 });
    const results = await runLoop(config);

    expect(results).toHaveLength(1);
    expect(results[0].sentinel).toBe(SENTINELS.PLAN_REFINED);
  });

  it("stops on non-zero exit code", async () => {
    mockExecaWith([], 1);

    const config = makeConfig({ maxIterations: 5 });
    const results = await runLoop(config);

    expect(results).toHaveLength(1);
    expect(results[0].exitCode).toBe(1);
  });

  it("calls event callbacks", async () => {
    const lines = [
      JSON.stringify({
        type: "assistant",
        message: {
          content: [
            { type: "text", text: "Hello" },
            {
              type: "tool_use",
              name: "Read",
              input: { file_path: "/foo.ts" },
            },
          ],
        },
      }),
    ];
    mockExecaWith(lines);

    const onText = vi.fn();
    const onToolUse = vi.fn();
    const onIterationStart = vi.fn();
    const onIterationEnd = vi.fn();

    const config = makeConfig({
      maxIterations: 1,
      onText,
      onToolUse,
      onIterationStart,
      onIterationEnd,
    });

    await runLoop(config);

    expect(onIterationStart).toHaveBeenCalledWith(1, 1);
    expect(onIterationEnd).toHaveBeenCalledWith(1, expect.any(Number));
    expect(onText).toHaveBeenCalledWith("Hello");
    expect(onToolUse).toHaveBeenCalledWith("Read", "/foo.ts");
  });

  it("passes correct claude arguments", async () => {
    mockExecaWith([]);

    const config = makeConfig({ maxIterations: 1 });
    await runLoop(config);

    expect(execa).toHaveBeenCalledWith(
      "claude",
      [
        "--dangerously-skip-permissions",
        "-p",
        "--verbose",
        "--output-format",
        "stream-json",
      ],
      expect.objectContaining({
        cwd: tempDir,
        input: expect.stringContaining("test-spec"),
        stdout: "pipe",
        stderr: "pipe",
      }),
    );
  });

  it("performs template substitution in prompt", async () => {
    mockExecaWith([]);

    const config = makeConfig({
      maxIterations: 1,
      templateVars: { specName: "my-spec", epicName: "my-epic" },
    });
    await runLoop(config);

    expect(execa).toHaveBeenCalledWith(
      "claude",
      expect.any(Array),
      expect.objectContaining({
        input: "Spec: my-spec, Iter: 1, Epic: my-epic",
      }),
    );
  });

  it("replaces empty epicName with empty string in template", async () => {
    mockExecaWith([]);

    const config = makeConfig({
      maxIterations: 1,
      templateVars: { specName: "spec-a" },
    });
    await runLoop(config);

    expect(execa).toHaveBeenCalledWith(
      "claude",
      expect.any(Array),
      expect.objectContaining({
        input: "Spec: spec-a, Iter: 1, Epic: ",
      }),
    );
  });
});
