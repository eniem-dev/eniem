import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as path from "path";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

vi.mock("../../lib/preflight.js", () => ({
  runPreflight: vi.fn(),
  printPreflightErrors: vi.fn(),
}));

vi.mock("../../lib/loop-engine.js", () => ({
  runLoop: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../lib/loop-renderer.js", () => ({
  createRenderer: vi.fn().mockReturnValue({
    callbacks: {},
    onLoopComplete: vi.fn(),
    onSigint: vi.fn(),
    cleanup: vi.fn(),
  }),
}));

import { runAiBuild, hasReadyTasks } from "../ai-build.js";
import { execa } from "execa";
import { runPreflight } from "../../lib/preflight.js";
import { runLoop } from "../../lib/loop-engine.js";
import { createRenderer } from "../../lib/loop-renderer.js";

describe("hasReadyTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when bd ready returns empty output", async () => {
    vi.mocked(execa).mockResolvedValueOnce({
      stdout: "",
    } as never);

    expect(await hasReadyTasks("/tmp")).toBe(false);
  });

  it("returns false when bd ready throws", async () => {
    vi.mocked(execa).mockRejectedValueOnce(new Error("bd not found"));

    expect(await hasReadyTasks("/tmp")).toBe(false);
  });

  it("returns true when ready tasks exist", async () => {
    vi.mocked(execa).mockResolvedValueOnce({
      stdout: `📋 Ready work (2 issues):

1. [● P2] [task] eniem-jmh: Wire eni ai build command
2. [● P2] [task] eniem-adk: Implement eni land command`,
    } as never);

    expect(await hasReadyTasks("/tmp")).toBe(true);
  });

  it("filters by epic name when provided", async () => {
    vi.mocked(execa).mockResolvedValueOnce({
      stdout: `📋 Ready work (2 issues):

1. [● P2] [task] eniem-jmh: Wire eni ai build command for my-epic
2. [● P2] [task] eniem-adk: Implement eni land command`,
    } as never);

    expect(await hasReadyTasks("/tmp", "my-epic")).toBe(true);
  });

  it("returns false when no tasks match epic filter", async () => {
    vi.mocked(execa).mockResolvedValueOnce({
      stdout: `📋 Ready work (1 issue):

1. [● P2] [task] eniem-adk: Implement eni land command`,
    } as never);

    expect(await hasReadyTasks("/tmp", "nonexistent-epic")).toBe(false);
  });
});

describe("runAiBuild", () => {
  let mockExit: ReturnType<typeof vi.spyOn>;
  let mockLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExit = vi
      .spyOn(process, "exit")
      .mockImplementation((() => {}) as unknown as (code?: number) => never);
    mockLog = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockLog.mockRestore();
  });

  it("exits with error for 0 iterations", async () => {
    await runAiBuild({ iterations: 0, debug: false, cwd: "/tmp" });
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("exits with error when preflight fails", async () => {
    vi.mocked(runPreflight).mockResolvedValueOnce([
      { message: "claude CLI not found" },
    ]);

    await runAiBuild({ debug: false, cwd: "/tmp" });
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("exits with message when no ready tasks", async () => {
    vi.mocked(runPreflight).mockResolvedValueOnce([]);
    vi.mocked(execa).mockResolvedValueOnce({ stdout: "" } as never);

    await runAiBuild({ debug: false, cwd: "/tmp" });

    expect(mockLog).toHaveBeenCalledWith(
      "No ready tasks. Run `eni ai plan` first or check: `bd blocked`",
    );
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it("runs the loop when ready tasks exist", async () => {
    vi.mocked(runPreflight).mockResolvedValueOnce([]);
    vi.mocked(execa).mockResolvedValueOnce({
      stdout: `📋 Ready work (1 issue):

1. [● P2] [task] eniem-jmh: Wire eni ai build command`,
    } as never);

    await runAiBuild({ debug: false, cwd: "/tmp" });

    expect(runLoop).toHaveBeenCalled();
  });

  it("passes epic name to template vars", async () => {
    vi.mocked(runPreflight).mockResolvedValueOnce([]);
    vi.mocked(execa).mockResolvedValueOnce({
      stdout: `📋 Ready work (1 issue):

1. [● P2] [task] eniem-jmh: Wire build for my-epic`,
    } as never);

    await runAiBuild({
      epicName: "my-epic",
      debug: false,
      cwd: "/my/project",
    });

    expect(runLoop).toHaveBeenCalledWith(
      expect.objectContaining({
        promptFile: path.join("/my/project", ".eni/PROMPT_build.md"),
        templateVars: { epicName: "my-epic" },
        cwd: "/my/project",
      }),
    );
  });

  it("uses default 10 iterations when not specified", async () => {
    vi.mocked(runPreflight).mockResolvedValueOnce([]);
    vi.mocked(execa).mockResolvedValueOnce({
      stdout: `📋 Ready work (1 issue):

1. [● P2] [task] eniem-jmh: Wire build`,
    } as never);

    await runAiBuild({ debug: false, cwd: "/tmp" });

    expect(createRenderer).toHaveBeenCalledWith({
      debug: false,
      maxIterations: 10,
    });
  });

  it("passes iteration count override", async () => {
    vi.mocked(runPreflight).mockResolvedValueOnce([]);
    vi.mocked(execa).mockResolvedValueOnce({
      stdout: `📋 Ready work (1 issue):

1. [● P2] [task] eniem-jmh: Wire build`,
    } as never);

    await runAiBuild({
      iterations: 20,
      debug: true,
      cwd: "/tmp",
    });

    expect(createRenderer).toHaveBeenCalledWith({
      debug: true,
      maxIterations: 20,
    });
  });
});
