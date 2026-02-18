import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

import { runLand } from "../land.js";
import { execa } from "execa";

// Mock process.exit to throw so execution stops (same pattern as ai-setup.test.ts)
const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
  throw new Error("process.exit called");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any);

describe("runLand", () => {
  let logOutput: string[];
  const originalLog = console.log;

  beforeEach(() => {
    vi.clearAllMocks();
    logOutput = [];
    console.log = (...args: unknown[]) => {
      logOutput.push(args.map(String).join(" "));
    };
  });

  afterEach(() => {
    console.log = originalLog;
  });

  function mockExecaSequence(
    calls: Array<{ stdout?: string; reject?: boolean; error?: string }>,
  ) {
    for (const call of calls) {
      if (call.reject) {
        vi.mocked(execa).mockRejectedValueOnce(
          new Error(call.error ?? "command failed"),
        );
      } else {
        vi.mocked(execa).mockResolvedValueOnce({
          stdout: call.stdout ?? "",
        } as never);
      }
    }
  }

  it("exits with error when not in a git repo", async () => {
    mockExecaSequence([{ reject: true, error: "not a git repository" }]);

    await expect(runLand()).rejects.toThrow("process.exit called");

    const output = logOutput.join("\n");
    expect(output).toContain("Not in a git repository");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("exits with error when bd is not installed", async () => {
    mockExecaSequence([
      // git rev-parse (is git repo)
      { stdout: "true" },
      // git status --porcelain (no uncommitted changes)
      { stdout: "" },
      // bd sync --full (not found)
      { reject: true, error: "ENOENT" },
    ]);

    await expect(runLand()).rejects.toThrow("process.exit called");

    const output = logOutput.join("\n");
    expect(output).toContain("bd not found");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("shows successful flow: sync → push → success", async () => {
    mockExecaSequence([
      // git rev-parse (is git repo)
      { stdout: "true" },
      // git status --porcelain (no uncommitted changes)
      { stdout: "" },
      // bd sync --full
      { stdout: "" },
      // git rev-parse --abbrev-ref @{u} (has upstream)
      { stdout: "origin/feat/test" },
      // git push
      { stdout: "" },
      // git status (up to date check)
      { stdout: "Your branch is up to date with 'origin/feat/test'" },
    ]);

    await runLand();

    const output = logOutput.join("\n");
    expect(output).toContain("bd sync full");
    expect(output).toContain("git push");
    expect(output).toContain("All work pushed. Branch is up to date with origin.");
  });

  it("shows push-rejected flow: sync → push fail → rebase → push → success", async () => {
    mockExecaSequence([
      // git rev-parse (is git repo)
      { stdout: "true" },
      // git status --porcelain (no uncommitted changes)
      { stdout: "" },
      // bd sync --full
      { stdout: "" },
      // git rev-parse --abbrev-ref @{u} (has upstream)
      { stdout: "origin/feat/test" },
      // git push (fails)
      { reject: true, error: "rejected" },
      // git pull --rebase
      { stdout: "" },
      // git rev-parse --abbrev-ref @{u} (has upstream - retry push)
      { stdout: "origin/feat/test" },
      // git push (succeeds)
      { stdout: "" },
      // git status (up to date check)
      { stdout: "Your branch is up to date with 'origin/feat/test'" },
    ]);

    await runLand();

    const output = logOutput.join("\n");
    expect(output).toContain("bd sync full");
    expect(output).toContain("git push (rejected)");
    expect(output).toContain("git pull --rebase");
    expect(output).toContain("All work pushed. Branch is up to date with origin.");
  });

  it("shows double-push-failure flow: error message", async () => {
    mockExecaSequence([
      // git rev-parse (is git repo)
      { stdout: "true" },
      // git status --porcelain (no uncommitted changes)
      { stdout: "" },
      // bd sync --full
      { stdout: "" },
      // git rev-parse --abbrev-ref @{u} (has upstream)
      { stdout: "origin/feat/test" },
      // git push (fails)
      { reject: true, error: "rejected" },
      // git pull --rebase (fails with conflicts)
      { reject: true, error: "conflict" },
    ]);

    await expect(runLand()).rejects.toThrow("process.exit called");

    const output = logOutput.join("\n");
    expect(output).toContain("git push (rejected)");
    expect(output).toContain("Push failed. Resolve conflicts and try again.");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("warns about uncommitted changes but still proceeds", async () => {
    mockExecaSequence([
      // git rev-parse (is git repo)
      { stdout: "true" },
      // git status --porcelain (has uncommitted changes)
      { stdout: " M src/index.ts" },
      // bd sync --full
      { stdout: "" },
      // git rev-parse --abbrev-ref @{u} (has upstream)
      { stdout: "origin/feat/test" },
      // git push
      { stdout: "" },
      // git status (up to date check)
      { stdout: "Your branch is up to date with 'origin/feat/test'" },
    ]);

    await runLand();

    const output = logOutput.join("\n");
    expect(output).toContain("Uncommitted changes detected");
    expect(output).toContain("All work pushed");
  });

  it("pushes with -u origin HEAD when no upstream exists", async () => {
    mockExecaSequence([
      // git rev-parse (is git repo)
      { stdout: "true" },
      // git status --porcelain (no uncommitted changes)
      { stdout: "" },
      // bd sync --full
      { stdout: "" },
      // git rev-parse --abbrev-ref @{u} (no upstream)
      { reject: true, error: "no upstream" },
      // git push -u origin HEAD
      { stdout: "" },
      // git status (up to date check)
      { stdout: "Your branch is up to date with 'origin/feat/test'" },
    ]);

    await runLand();

    expect(vi.mocked(execa)).toHaveBeenCalledWith("git", [
      "push",
      "-u",
      "origin",
      "HEAD",
    ]);
  });

  it("shows bd sync failure", async () => {
    mockExecaSequence([
      // git rev-parse (is git repo)
      { stdout: "true" },
      // git status --porcelain
      { stdout: "" },
      // bd sync --full (fails)
      { reject: true, error: "sync failed: database locked" },
    ]);

    await expect(runLand()).rejects.toThrow("process.exit called");

    const output = logOutput.join("\n");
    expect(output).toContain("bd sync full");
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
