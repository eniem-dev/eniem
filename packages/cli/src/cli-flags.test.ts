import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execaNode } from "execa";
import { fileURLToPath } from "url";
import { dirname, resolve, join } from "path";
import { mkdtemp, mkdir, writeFile, rm } from "fs/promises";
import { tmpdir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = resolve(__dirname, "../dist/cli.js");

describe("CLI --app-name flag", () => {
  it("exits with error when --app-name is empty string", async () => {
    const result = await execaNode(CLI_PATH, ["my-app", "--app-name="], {
      reject: false,
      timeout: 10_000,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("--app-name cannot be empty");
  }, 15_000);
});

describe("CLI --cli flag", () => {
  it("exits with error when --cli is an invalid name", async () => {
    const result = await execaNode(CLI_PATH, ["plan", "--cli=invalid"], {
      reject: false,
      timeout: 10_000,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Unknown CLI: invalid");
    expect(result.stderr).toContain("claude, codex, gemini, opencode");
  }, 15_000);

  it("help text includes --cli option", async () => {
    const result = await execaNode(CLI_PATH, ["--help"], {
      reject: false,
      timeout: 10_000,
    });

    expect(result.stdout).toContain("--cli");
    expect(result.stdout).toContain("AI CLI backend");
  }, 15_000);
});

describe("CLI plan command flags", () => {
  it("exits with error when --iterations is 0", async () => {
    const result = await execaNode(CLI_PATH, ["plan", "--iterations=0"], {
      reject: false,
      timeout: 10_000,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Iterations must be at least 1");
  }, 15_000);

  it("help text includes plan command", async () => {
    const result = await execaNode(CLI_PATH, ["--help"], {
      reject: false,
      timeout: 10_000,
    });

    expect(result.stdout).toContain("plan");
    expect(result.stdout).toContain("Run AI planning loop on a spec file");
    expect(result.stdout).toContain("--spec");
    expect(result.stdout).toContain("--iterations");
    expect(result.stdout).toContain("--verbose");
    expect(result.stdout).toContain("--no-verbose");
  }, 15_000);
});

describe("CLI --list flag (plan)", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "eni-list-plan-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("lists specs alphabetically when specs/ has files", async () => {
    await mkdir(join(tmpDir, "specs"), { recursive: true });
    await writeFile(join(tmpDir, "specs", "b-spec.md"), "# B");
    await writeFile(join(tmpDir, "specs", "a-spec.md"), "# A");

    const result = await execaNode(CLI_PATH, ["plan", "--list"], {
      reject: false,
      timeout: 10_000,
      cwd: tmpDir,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("a-spec\nb-spec");
  }, 15_000);

  it("prints stderr message when specs/ is empty", async () => {
    await mkdir(join(tmpDir, "specs"), { recursive: true });

    const result = await execaNode(CLI_PATH, ["plan", "--list"], {
      reject: false,
      timeout: 10_000,
      cwd: tmpDir,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("No specs to plan");
    expect(result.stdout).toBe("");
  }, 15_000);

  it("prints stderr message when specs/ does not exist", async () => {
    const result = await execaNode(CLI_PATH, ["plan", "--list"], {
      reject: false,
      timeout: 10_000,
      cwd: tmpDir,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("No specs to plan");
    expect(result.stdout).toBe("");
  }, 15_000);
});

describe("CLI --list flag (build)", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "eni-list-build-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("lists planned specs alphabetically", async () => {
    await mkdir(join(tmpDir, "specs", "planned"), { recursive: true });
    await writeFile(join(tmpDir, "specs", "planned", "y.md"), "# Y");
    await writeFile(join(tmpDir, "specs", "planned", "x.md"), "# X");

    const result = await execaNode(CLI_PATH, ["build", "--list"], {
      reject: false,
      timeout: 10_000,
      cwd: tmpDir,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("x\ny");
  }, 15_000);

  it("prints stderr message when specs/planned/ does not exist", async () => {
    const result = await execaNode(CLI_PATH, ["build", "--list"], {
      reject: false,
      timeout: 10_000,
      cwd: tmpDir,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("No planned specs to build");
    expect(result.stdout).toBe("");
  }, 15_000);
});

describe("CLI --list flag (isolation)", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "eni-list-iso-"));
    await mkdir(join(tmpDir, "specs"), { recursive: true });
    await writeFile(join(tmpDir, "specs", "test.md"), "# Test");
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("ignores --iterations=0 when --list is present", async () => {
    const result = await execaNode(
      CLI_PATH,
      ["plan", "--list", "--iterations=0"],
      { reject: false, timeout: 10_000, cwd: tmpDir },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("test");
  }, 15_000);

  it("ignores --spec when --list is present", async () => {
    const result = await execaNode(
      CLI_PATH,
      ["plan", "--list", "--spec=foo"],
      { reject: false, timeout: 10_000, cwd: tmpDir },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("test");
  }, 15_000);
});

describe("CLI --list flag (output format)", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "eni-list-fmt-"));
    await mkdir(join(tmpDir, "specs"), { recursive: true });
    await writeFile(join(tmpDir, "specs", "alpha.md"), "# A");
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("contains no ANSI escape codes", async () => {
    const result = await execaNode(CLI_PATH, ["plan", "--list"], {
      reject: false,
      timeout: 10_000,
      cwd: tmpDir,
    });

    expect(result.exitCode).toBe(0);
    // eslint-disable-next-line no-control-regex
    expect(result.stdout).not.toMatch(/\x1b\[/);
  }, 15_000);

  it("help text includes --list", async () => {
    const result = await execaNode(CLI_PATH, ["--help"], {
      reject: false,
      timeout: 10_000,
    });

    expect(result.stdout).toContain("--list");
  }, 15_000);
});
