import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import {
  runPreflight,
  listAvailableSpecs,
  listUnplannedSpecs,
} from "../preflight.js";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

import { execa } from "execa";

describe("runPreflight", () => {
  let tempDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "preflight-test-"));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  async function setupMinimalProject(): Promise<void> {
    await fs.mkdir(path.join(tempDir, ".eni"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "specs"), { recursive: true });
    await fs.mkdir(path.join(tempDir, ".beads"), { recursive: true });
    await fs.writeFile(path.join(tempDir, "AGENTS.md"), "# Agents");
    await fs.writeFile(
      path.join(tempDir, ".eni", "PROMPT_plan.md"),
      "Plan {{SPEC_NAME}}",
    );
  }

  function mockCommandInPath(): void {
    const mockedExeca = vi.mocked(execa);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedExeca.mockResolvedValue({ stdout: "/usr/bin/cmd" } as any);
  }

  it("returns error when .eni/ is missing", async () => {
    const errors = await runPreflight(tempDir, {
      promptFile: ".eni/PROMPT_plan.md",
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe("run `eni ai setup` first");
  });

  it("returns error when claude is not in PATH", async () => {
    await setupMinimalProject();
    const mockedExeca = vi.mocked(execa);
    mockedExeca
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockRejectedValueOnce(new Error("not found") as any) // claude
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValueOnce({ stdout: "/usr/bin/bd" } as any); // bd

    const errors = await runPreflight(tempDir, {
      promptFile: ".eni/PROMPT_plan.md",
    });

    const claudeError = errors.find((e) => e.message.includes("claude"));
    expect(claudeError).toBeDefined();
    expect(claudeError!.hint).toContain("https://docs.anthropic.com");
  });

  it("returns error when bd is not in PATH", async () => {
    await setupMinimalProject();
    const mockedExeca = vi.mocked(execa);
    mockedExeca
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValueOnce({ stdout: "/usr/bin/claude" } as any) // claude
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockRejectedValueOnce(new Error("not found") as any); // bd

    const errors = await runPreflight(tempDir, {
      promptFile: ".eni/PROMPT_plan.md",
    });

    const bdError = errors.find((e) => e.message.includes("bd"));
    expect(bdError).toBeDefined();
    expect(bdError!.hint).toContain("Install beads");
  });

  it("returns error when AGENTS.md is missing", async () => {
    await fs.mkdir(path.join(tempDir, ".eni"), { recursive: true });
    await fs.mkdir(path.join(tempDir, ".beads"), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, ".eni", "PROMPT_plan.md"),
      "Plan",
    );
    mockCommandInPath();

    const errors = await runPreflight(tempDir, {
      promptFile: ".eni/PROMPT_plan.md",
    });

    const agentsError = errors.find((e) =>
      e.message.includes("AGENTS.md not found"),
    );
    expect(agentsError).toBeDefined();
  });

  it("returns error when prompt file is missing", async () => {
    await fs.mkdir(path.join(tempDir, ".eni"), { recursive: true });
    await fs.mkdir(path.join(tempDir, ".beads"), { recursive: true });
    await fs.writeFile(path.join(tempDir, "AGENTS.md"), "# Agents");
    mockCommandInPath();

    const errors = await runPreflight(tempDir, {
      promptFile: ".eni/PROMPT_plan.md",
    });

    const promptError = errors.find((e) =>
      e.message.includes("PROMPT_plan.md not found"),
    );
    expect(promptError).toBeDefined();
  });

  it("returns error when spec file does not exist", async () => {
    await setupMinimalProject();
    mockCommandInPath();

    const errors = await runPreflight(tempDir, {
      promptFile: ".eni/PROMPT_plan.md",
      specFile: "nonexistent",
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe("specs/nonexistent.md not found");
  });

  it("returns no errors when all checks pass", async () => {
    await setupMinimalProject();
    await fs.writeFile(
      path.join(tempDir, "specs", "my-feature.md"),
      "# Feature",
    );
    mockCommandInPath();

    const errors = await runPreflight(tempDir, {
      promptFile: ".eni/PROMPT_plan.md",
      specFile: "my-feature",
    });

    expect(errors).toHaveLength(0);
  });
});

describe("listAvailableSpecs", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "specs-test-"));
    await fs.mkdir(path.join(tempDir, "specs"));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it("lists .md files from specs/ without extension", async () => {
    await fs.writeFile(path.join(tempDir, "specs", "auth.md"), "");
    await fs.writeFile(path.join(tempDir, "specs", "billing.md"), "");
    await fs.writeFile(path.join(tempDir, "specs", ".gitkeep"), "");

    const specs = await listAvailableSpecs(tempDir);
    expect(specs).toContain("auth");
    expect(specs).toContain("billing");
    expect(specs).not.toContain(".gitkeep");
  });

  it("returns empty array when specs/ does not exist", async () => {
    const noSpecsDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "no-specs-test-"),
    );
    const specs = await listAvailableSpecs(noSpecsDir);
    expect(specs).toEqual([]);
    await fs.rm(noSpecsDir, { recursive: true, force: true });
  });
});

describe("listUnplannedSpecs", () => {
  let tempDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "unplanned-test-"));
    await fs.mkdir(path.join(tempDir, "specs"));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it("filters out specs with matching beads epic", async () => {
    await fs.writeFile(path.join(tempDir, "specs", "auth.md"), "");
    await fs.writeFile(path.join(tempDir, "specs", "billing.md"), "");

    const mockedExeca = vi.mocked(execa);
    // bd list --type=epic returns output containing "auth" epic
    mockedExeca.mockResolvedValueOnce({
      stdout: "[epic] eniem-abc: auth: Implement authentication",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const unplanned = await listUnplannedSpecs(tempDir);
    expect(unplanned).toEqual(["billing"]);
  });

  it("returns all specs when bd fails", async () => {
    await fs.writeFile(path.join(tempDir, "specs", "auth.md"), "");

    const mockedExeca = vi.mocked(execa);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedExeca.mockRejectedValueOnce(new Error("bd not found") as any);

    const unplanned = await listUnplannedSpecs(tempDir);
    expect(unplanned).toEqual(["auth"]);
  });
});
