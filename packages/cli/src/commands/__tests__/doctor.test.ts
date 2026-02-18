import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  default: {
    access: vi.fn(),
  },
}));

import { runDoctor } from "../doctor.js";
import { execa } from "execa";
import fs from "node:fs/promises";

const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
  throw new Error("process.exit called");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any);

describe("runDoctor", () => {
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

  function mockToolVersions(
    tools: Record<string, { version?: string; reject?: boolean }>,
  ) {
    // The first execa call is git rev-parse for isGitRepo
    // Then 4 CLI tool checks: node, pnpm, claude, bd
    vi.mocked(execa).mockImplementation(((cmd: string, args: string[]) => {
      if (cmd === "git" && args[0] === "rev-parse") {
        // Default: in a git repo
        return Promise.resolve({ stdout: "true" });
      }
      const tool = tools[cmd];
      if (tool?.reject) {
        return Promise.reject(new Error("ENOENT"));
      }
      return Promise.resolve({ stdout: tool?.version ?? "1.0.0" });
    }) as typeof execa);
  }

  function mockFsAccess(existing: string[]) {
    vi.mocked(fs.access).mockImplementation((path) => {
      if (existing.includes(path as string)) {
        return Promise.resolve();
      }
      return Promise.reject(new Error("ENOENT"));
    });
  }

  it("shows all checks passing with exit code 0", async () => {
    mockToolVersions({
      node: { version: "v20.11.0" },
      pnpm: { version: "9.1.0" },
      claude: { version: "1.2.0" },
      bd: { version: "0.8.0" },
    });
    mockFsAccess([
      ".beads",
      ".eni",
      ".eni/PROMPT_plan.md",
      ".eni/PROMPT_build.md",
      ".claude/settings.json",
      "AGENTS.md",
      ".env",
      "specs",
    ]);

    await runDoctor();

    const output = logOutput.join("\n");
    expect(output).toContain("Node.js 20.11.0");
    expect(output).toContain("pnpm 9.1.0");
    expect(output).toContain("Claude CLI 1.2.0");
    expect(output).toContain("bd (beads) 0.8.0");
    expect(output).toContain("12/12 checks passed");
    expect(mockExit).not.toHaveBeenCalled();
  });

  it("shows failing tool with red X and fix suggestion", async () => {
    mockToolVersions({
      node: { version: "v20.11.0" },
      pnpm: { version: "9.1.0" },
      claude: { reject: true },
      bd: { version: "0.8.0" },
    });
    mockFsAccess([
      ".beads",
      ".eni",
      ".eni/PROMPT_plan.md",
      ".eni/PROMPT_build.md",
      ".claude/settings.json",
      "AGENTS.md",
      ".env",
      "specs",
    ]);

    await expect(runDoctor()).rejects.toThrow("process.exit called");

    const output = logOutput.join("\n");
    expect(output).toContain("\x1b[31m✗\x1b[0m Claude CLI");
    expect(output).toContain("Install Claude Code");
    expect(output).toContain("11/12 checks passed");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("skips repo-specific checks when not in git repo", async () => {
    vi.mocked(execa).mockImplementation(((cmd: string, args: string[]) => {
      if (cmd === "git" && args[0] === "rev-parse") {
        return Promise.reject(new Error("not a git repo"));
      }
      return Promise.resolve({ stdout: "1.0.0" });
    }) as typeof execa);

    await runDoctor();

    const output = logOutput.join("\n");
    expect(output).toContain("Not in a git repository");
    expect(output).toContain("4/4 checks passed");
    // Should NOT contain repo-specific checks
    expect(output).not.toContain(".beads/");
    expect(output).not.toContain(".eni/");
    expect(output).not.toContain("AGENTS.md");
    expect(mockExit).not.toHaveBeenCalled();
  });

  it("handles missing .eni/ without crashing", async () => {
    mockToolVersions({
      node: { version: "v20.11.0" },
      pnpm: { version: "9.1.0" },
      claude: { version: "1.2.0" },
      bd: { version: "0.8.0" },
    });
    // .eni/ is missing, so PROMPT files inside it also fail
    mockFsAccess([
      ".beads",
      ".claude/settings.json",
      "AGENTS.md",
      ".env",
      "specs",
    ]);

    await expect(runDoctor()).rejects.toThrow("process.exit called");

    const output = logOutput.join("\n");
    expect(output).toContain("\x1b[31m✗\x1b[0m .eni/ directory");
    expect(output).toContain("\x1b[31m✗\x1b[0m PROMPT_plan.md");
    expect(output).toContain("\x1b[31m✗\x1b[0m PROMPT_build.md");
    expect(output).toContain("Run: eni ai setup");
    expect(output).toContain("9/12 checks passed");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("returns correct DoctorCheck shape for each check", async () => {
    mockToolVersions({
      node: { version: "v20.11.0" },
      pnpm: { reject: true },
      claude: { version: "1.2.0" },
      bd: { version: "0.8.0" },
    });
    mockFsAccess([
      ".beads",
      ".eni",
      ".eni/PROMPT_plan.md",
      ".eni/PROMPT_build.md",
      ".claude/settings.json",
      "AGENTS.md",
      ".env",
      "specs",
    ]);

    await expect(runDoctor()).rejects.toThrow("process.exit called");

    const output = logOutput.join("\n");
    // Passing tool shows version
    expect(output).toContain("\x1b[32m✓\x1b[0m Node.js 20.11.0");
    // Failing tool shows fix
    expect(output).toContain("\x1b[31m✗\x1b[0m pnpm");
    expect(output).toContain("Install pnpm: npm install -g pnpm");
    expect(output).toContain("11/12 checks passed");
  });
});
