import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  default: {
    access: vi.fn(),
    readdir: vi.fn(),
  },
}));

import { runStatus } from "../status.js";
import { execa } from "execa";
import fs from "node:fs/promises";

describe("runStatus", () => {
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

  function mockExecaImpl(
    handlers: Record<string, (args: string[]) => { stdout: string } | Error>,
  ) {
    vi.mocked(execa).mockImplementation(((cmd: string, args: string[]) => {
      const key = `${cmd} ${args.join(" ")}`;
      // Try exact match first
      for (const [pattern, handler] of Object.entries(handlers)) {
        if (key.startsWith(pattern) || key === pattern) {
          const result = handler(args);
          if (result instanceof Error) {
            return Promise.reject(result);
          }
          return Promise.resolve(result);
        }
      }
      // Default: resolve with empty stdout
      return Promise.resolve({ stdout: "" });
    }) as unknown as typeof execa);
  }

  it("shows 'Not in a git repository' when not in a git repo", async () => {
    mockExecaImpl({
      "git rev-parse --is-inside-work-tree": () =>
        new Error("not a git repo"),
    });

    await runStatus();

    const output = logOutput.join("\n");
    expect(output).toContain("Not in a git repository");
    // Should not contain specs or branch info
    expect(output).not.toContain("Specs:");
    expect(output).not.toContain("Branch:");
  });

  it("shows specs with epic status and task progress", async () => {
    // Git repo check
    mockExecaImpl({
      "git rev-parse --is-inside-work-tree": () => ({ stdout: "true" }),
      "git branch --show-current": () => ({ stdout: "feat/auth-flow" }),
      "git status --porcelain": () => ({ stdout: "" }),
      "git rev-list --count @{u}..HEAD": () => ({ stdout: "3" }),
      "git rev-list --count HEAD..@{u}": () => ({ stdout: "0" }),
      "git log -1 --format=%cr": () => ({ stdout: "2 hours ago" }),
      "bd list --type=epic --json": () => ({
        stdout: JSON.stringify([
          { id: "beads-001", title: "auth-flow: User Authentication" },
          { id: "beads-008", title: "pricing-page: Pricing Updates" },
        ]),
      }),
      "bd count --notes-contains=beads-001 --by-status --json": () => ({
        stdout: JSON.stringify({
          total: 7,
          groups: [
            { group: "closed", count: 3 },
            { group: "open", count: 4 },
          ],
        }),
      }),
      "bd count --notes-contains=beads-008 --by-status --json": () => ({
        stdout: JSON.stringify({
          total: 5,
          groups: [
            { group: "open", count: 5 },
          ],
        }),
      }),
      "bd count --status=open --json": () => ({
        stdout: JSON.stringify({ count: 5 }),
      }),
      "bd count --status=closed --json": () => ({
        stdout: JSON.stringify({ count: 12 }),
      }),
      "bd blocked --json": () => ({ stdout: JSON.stringify([{ id: "b1" }]) }),
      "bd ready --json": () => ({
        stdout: JSON.stringify([{ id: "r1" }, { id: "r2" }]),
      }),
    });

    // .beads/ exists
    vi.mocked(fs.access).mockResolvedValue(undefined);

    // specs directory has 3 files
    vi.mocked(fs.readdir).mockResolvedValue([
      { name: "auth-flow.md", isFile: () => true },
      { name: "pricing-page.md", isFile: () => true },
      { name: "onboarding.md", isFile: () => true },
    ] as never);

    await runStatus();

    const output = logOutput.join("\n");
    expect(output).toContain("Specs:");
    expect(output).toContain("auth-flow");
    expect(output).toContain("epic: beads-001");
    expect(output).toContain("3/7 tasks done");
    expect(output).toContain("pricing-page");
    expect(output).toContain("epic: beads-008");
    expect(output).toContain("0/5 tasks done");
    expect(output).toContain("onboarding");
    expect(output).toContain("no epic");
    expect(output).toContain("Tasks:");
    expect(output).toContain("2 ready");
    expect(output).toContain("1 blocked");
    expect(output).toContain("5 open");
    expect(output).toContain("12 closed");
    expect(output).toContain("Branch: feat/auth-flow");
    expect(output).toContain("3 ahead");
    expect(output).toContain("0 behind");
    expect(output).toContain("clean");
    expect(output).toContain("Last commit: 2 hours ago");
  });

  it("shows task counts from bd commands", async () => {
    mockExecaImpl({
      "git rev-parse --is-inside-work-tree": () => ({ stdout: "true" }),
      "git branch --show-current": () => ({ stdout: "main" }),
      "git status --porcelain": () => ({ stdout: "" }),
      "git rev-list": () => ({ stdout: "0" }),
      "git log -1": () => ({ stdout: "1 day ago" }),
      "bd list --type=epic --json": () => ({ stdout: "[]" }),
      "bd count --status=open --json": () => ({
        stdout: JSON.stringify({ count: 10 }),
      }),
      "bd count --status=closed --json": () => ({
        stdout: JSON.stringify({ count: 20 }),
      }),
      "bd blocked --json": () => ({
        stdout: JSON.stringify([{ id: "b1" }, { id: "b2" }, { id: "b3" }]),
      }),
      "bd ready --json": () => ({
        stdout: JSON.stringify([{ id: "r1" }]),
      }),
    });

    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.readdir).mockResolvedValue([] as never);

    await runStatus();

    const output = logOutput.join("\n");
    expect(output).toContain("1 ready");
    expect(output).toContain("3 blocked");
    expect(output).toContain("10 open");
    expect(output).toContain("20 closed");
  });

  it("shows git branch with ahead/behind and dirty state", async () => {
    mockExecaImpl({
      "git rev-parse --is-inside-work-tree": () => ({ stdout: "true" }),
      "git branch --show-current": () => ({ stdout: "feat/test" }),
      "git status --porcelain": () => ({ stdout: " M src/index.ts\n?? new.ts" }),
      "git rev-list --count @{u}..HEAD": () => ({ stdout: "2" }),
      "git rev-list --count HEAD..@{u}": () => ({ stdout: "1" }),
      "git log -1 --format=%cr": () => ({ stdout: "30 minutes ago" }),
      "bd list --type=epic --json": () => ({ stdout: "[]" }),
      "bd count --status=open --json": () => ({
        stdout: JSON.stringify({ count: 0 }),
      }),
      "bd count --status=closed --json": () => ({
        stdout: JSON.stringify({ count: 0 }),
      }),
      "bd blocked --json": () => ({ stdout: "[]" }),
      "bd ready --json": () => ({ stdout: "[]" }),
    });

    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.readdir).mockResolvedValue([] as never);

    await runStatus();

    const output = logOutput.join("\n");
    expect(output).toContain("Branch: feat/test");
    expect(output).toContain("2 ahead");
    expect(output).toContain("1 behind");
    expect(output).toContain("dirty");
    expect(output).toContain("Last commit: 30 minutes ago");
  });

  it("shows fallback when beads not initialized", async () => {
    mockExecaImpl({
      "git rev-parse --is-inside-work-tree": () => ({ stdout: "true" }),
      "git branch --show-current": () => ({ stdout: "main" }),
      "git status --porcelain": () => ({ stdout: "" }),
      "git rev-list": () => ({ stdout: "0" }),
      "git log -1": () => ({ stdout: "1 day ago" }),
    });

    // .beads/ does not exist
    vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));

    // specs/ exists with files
    vi.mocked(fs.readdir).mockResolvedValue([
      { name: "auth-flow.md", isFile: () => true },
      { name: "pricing-page.md", isFile: () => true },
    ] as never);

    await runStatus();

    const output = logOutput.join("\n");
    expect(output).toContain("Specs:");
    expect(output).toContain("auth-flow");
    expect(output).toContain("pricing-page");
    expect(output).toContain("Beads not initialized. Run: eni ai setup");
    // Should NOT show "no epic" or task counts
    expect(output).not.toContain("no epic");
    expect(output).not.toContain("Tasks:");
    expect(output).toContain("Branch: main");
  });

  it("shows 'No specs found' when specs/ directory is missing", async () => {
    mockExecaImpl({
      "git rev-parse --is-inside-work-tree": () => ({ stdout: "true" }),
      "git branch --show-current": () => ({ stdout: "main" }),
      "git status --porcelain": () => ({ stdout: "" }),
      "git rev-list": () => ({ stdout: "0" }),
      "git log -1": () => ({ stdout: "5 minutes ago" }),
      "bd list --type=epic --json": () => ({ stdout: "[]" }),
      "bd count --status=open --json": () => ({
        stdout: JSON.stringify({ count: 0 }),
      }),
      "bd count --status=closed --json": () => ({
        stdout: JSON.stringify({ count: 0 }),
      }),
      "bd blocked --json": () => ({ stdout: "[]" }),
      "bd ready --json": () => ({ stdout: "[]" }),
    });

    vi.mocked(fs.access).mockResolvedValue(undefined);
    // readdir throws ENOENT for missing specs/
    vi.mocked(fs.readdir).mockRejectedValue(new Error("ENOENT"));

    await runStatus();

    const output = logOutput.join("\n");
    expect(output).toContain("No specs found");
  });

  it("handles not-in-git-repo scenario with exit code 0", async () => {
    const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);

    mockExecaImpl({
      "git rev-parse --is-inside-work-tree": () =>
        new Error("not a git repo"),
    });

    // Should NOT throw (exit code 0)
    await runStatus();

    expect(mockExit).not.toHaveBeenCalled();
    mockExit.mockRestore();
  });
});
