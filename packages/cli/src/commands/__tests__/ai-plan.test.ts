import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as path from "path";

vi.mock("../../lib/preflight.js", () => ({
  runPreflight: vi.fn(),
  printPreflightErrors: vi.fn(),
  listUnplannedSpecs: vi.fn(),
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

import { runAiPlan, executePlanLoop } from "../ai-plan.js";
import { runPreflight, listUnplannedSpecs } from "../../lib/preflight.js";
import { runLoop } from "../../lib/loop-engine.js";
import { createRenderer } from "../../lib/loop-renderer.js";

describe("runAiPlan", () => {
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExit = vi
      .spyOn(process, "exit")
      .mockImplementation((() => {}) as unknown as (code?: number) => never);
  });

  afterEach(() => {
    mockExit.mockRestore();
  });

  it("exits with error for 0 iterations", async () => {
    await runAiPlan({ iterations: 0, debug: false, cwd: "/tmp" });
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("exits with error when preflight fails (with spec)", async () => {
    vi.mocked(runPreflight).mockResolvedValueOnce([
      { message: "claude CLI not found" },
    ]);

    await runAiPlan({ specName: "my-feature", debug: false, cwd: "/tmp" });
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("returns needsSelector when no spec given and unplanned specs exist", async () => {
    vi.mocked(runPreflight).mockResolvedValueOnce([]);
    vi.mocked(listUnplannedSpecs).mockResolvedValueOnce(["auth", "billing"]);

    const result = await runAiPlan({ debug: false, cwd: "/tmp" });

    expect(result).toEqual({
      needsSelector: true,
      specs: ["auth", "billing"],
    });
  });

  it("exits when no unplanned specs found", async () => {
    vi.mocked(runPreflight).mockResolvedValueOnce([]);
    vi.mocked(listUnplannedSpecs).mockResolvedValueOnce([]);

    await runAiPlan({ debug: false, cwd: "/tmp" });
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it("runs the loop when spec name is given and preflight passes", async () => {
    vi.mocked(runPreflight).mockResolvedValueOnce([]);

    const result = await runAiPlan({
      specName: "my-feature",
      debug: false,
      cwd: "/tmp",
    });

    expect(result).toEqual({ needsSelector: false });
    expect(runLoop).toHaveBeenCalled();
  });

  it("passes correct iteration count override", async () => {
    vi.mocked(runPreflight).mockResolvedValueOnce([]);

    await runAiPlan({
      specName: "my-feature",
      iterations: 5,
      debug: true,
      cwd: "/tmp",
    });

    expect(createRenderer).toHaveBeenCalledWith({
      debug: true,
      maxIterations: 5,
    });
  });

  it("uses default 3 iterations when not specified", async () => {
    vi.mocked(runPreflight).mockResolvedValueOnce([]);

    await runAiPlan({
      specName: "my-feature",
      debug: false,
      cwd: "/tmp",
    });

    expect(createRenderer).toHaveBeenCalledWith({
      debug: false,
      maxIterations: 3,
    });
  });
});

describe("executePlanLoop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invokes runLoop with correct config", async () => {
    await executePlanLoop("my-feature", 5, true, "/my/project");

    expect(runLoop).toHaveBeenCalledWith(
      expect.objectContaining({
        promptFile: path.join("/my/project", ".eni/PROMPT_plan.md"),
        maxIterations: 5,
        templateVars: { specName: "my-feature" },
        cwd: "/my/project",
      }),
    );
  });
});
