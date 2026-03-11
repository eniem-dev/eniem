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
    expect(result.stderr).toContain("claude, codex, opencode");
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

describe("CLI --spec multi-select help text", () => {
  it("usage line shows comma-separated spec syntax", async () => {
    const result = await execaNode(CLI_PATH, ["--help"], {
      reject: false,
      timeout: 10_000,
    });

    expect(result.stdout).toContain("--spec=<name1,name2,...>");
  }, 15_000);

  it("examples include multi-spec usage", async () => {
    const result = await execaNode(CLI_PATH, ["--help"], {
      reject: false,
      timeout: 10_000,
    });

    expect(result.stdout).toContain("--spec=my-feature,other-feature");
  }, 15_000);

  it("spec option description mentions comma-separated", async () => {
    const result = await execaNode(CLI_PATH, ["--help"], {
      reject: false,
      timeout: 10_000,
    });

    expect(result.stdout).toContain("comma-separated");
  }, 15_000);
});

describe("CLI --spec flag validation (plan)", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "eni-spec-plan-"));
    await mkdir(join(tmpDir, "specs"), { recursive: true });
    await writeFile(join(tmpDir, "specs", "auth.md"), "# Auth");
    await writeFile(join(tmpDir, "specs", "payments.md"), "# Payments");
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("exits with error when --spec is empty", async () => {
    const result = await execaNode(CLI_PATH, ["plan", "--spec="], {
      reject: false,
      timeout: 10_000,
      cwd: tmpDir,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("No spec names provided");
  }, 15_000);

  it("exits with error for unrecognized spec names", async () => {
    const result = await execaNode(CLI_PATH, ["plan", "--spec=auth,unknown"], {
      reject: false,
      timeout: 10_000,
      cwd: tmpDir,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Unrecognized spec names");
    expect(result.stderr).toContain("unknown");
  }, 15_000);

  it("accepts valid comma-separated spec names", async () => {
    const result = await execaNode(CLI_PATH, ["plan", "--spec=auth,payments"], {
      reject: false,
      timeout: 10_000,
      cwd: tmpDir,
    });

    // Should not fail on validation (will fail later on missing prompt file, not on spec validation)
    expect(result.stderr).not.toContain("Unrecognized spec names");
    expect(result.stderr).not.toContain("No spec names provided");
  }, 15_000);
});

describe("CLI --spec flag validation (build)", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "eni-spec-build-"));
    await mkdir(join(tmpDir, "specs", "planned"), { recursive: true });
    await writeFile(join(tmpDir, "specs", "planned", "auth.md"), "# Auth");
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("exits with error when --spec is empty", async () => {
    const result = await execaNode(CLI_PATH, ["build", "--spec="], {
      reject: false,
      timeout: 10_000,
      cwd: tmpDir,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("No spec names provided");
  }, 15_000);

  it("exits with error for unrecognized spec names", async () => {
    const result = await execaNode(CLI_PATH, ["build", "--spec=missing"], {
      reject: false,
      timeout: 10_000,
      cwd: tmpDir,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Unrecognized spec names");
    expect(result.stderr).toContain("missing");
  }, 15_000);
});

describe("CLI --protocol flag", () => {
  it("exits with error when --protocol has invalid value", async () => {
    const result = await execaNode(CLI_PATH, ["my-app", "--protocol=ftp"], {
      reject: false,
      timeout: 10_000,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Invalid protocol "ftp"');
    expect(result.stderr).toContain("ssh");
    expect(result.stderr).toContain("https");
  }, 15_000);

  it("exits with error when --protocol is combined with --ssh", async () => {
    const result = await execaNode(CLI_PATH, ["my-app", "--protocol=ssh", "--ssh"], {
      reject: false,
      timeout: 10_000,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Cannot use --protocol with --ssh");
  }, 15_000);

  it("accepts --protocol=ssh without error", async () => {
    const result = await execaNode(CLI_PATH, ["--help", "--protocol=ssh"], {
      reject: false,
      timeout: 10_000,
    });

    expect(result.exitCode).toBe(0);
  }, 15_000);

  it("accepts --protocol=https without error", async () => {
    const result = await execaNode(CLI_PATH, ["--help", "--protocol=https"], {
      reject: false,
      timeout: 10_000,
    });

    expect(result.exitCode).toBe(0);
  }, 15_000);

  it("accepts --ssh shorthand without error", async () => {
    const result = await execaNode(CLI_PATH, ["--help", "--ssh"], {
      reject: false,
      timeout: 10_000,
    });

    expect(result.exitCode).toBe(0);
  }, 15_000);

  it("help text includes --protocol and --ssh options", async () => {
    const result = await execaNode(CLI_PATH, ["--help"], {
      reject: false,
      timeout: 10_000,
    });

    expect(result.stdout).toContain("--protocol");
    expect(result.stdout).toContain("--ssh");
  }, 15_000);
});

// eslint-disable-next-line no-control-regex
const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");

describe("CLI header spec name display", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "eni-header-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("plan header shows 'Plan — my-feature' when --spec flag is given", async () => {
    await mkdir(join(tmpDir, "specs"), { recursive: true });
    await writeFile(join(tmpDir, "specs", "my-feature.md"), "# My Feature");

    const result = await execaNode(CLI_PATH, ["plan", "--spec=my-feature"], {
      reject: false,
      timeout: 10_000,
      cwd: tmpDir,
    });

    expect(strip(result.stdout)).toContain("Plan — my-feature");
  }, 15_000);

  it("build header shows 'Build — my-feature' when --spec flag is given", async () => {
    await mkdir(join(tmpDir, "specs", "planned"), { recursive: true });
    await writeFile(join(tmpDir, "specs", "planned", "my-feature.md"), "# My Feature");

    const result = await execaNode(CLI_PATH, ["build", "--spec=my-feature"], {
      reject: false,
      timeout: 10_000,
      cwd: tmpDir,
    });

    expect(strip(result.stdout)).toContain("Build — my-feature");
  }, 15_000);

  it("logo is NOT rendered when plan --spec is used", async () => {
    await mkdir(join(tmpDir, "specs"), { recursive: true });
    await writeFile(join(tmpDir, "specs", "my-feature.md"), "# My Feature");

    const result = await execaNode(CLI_PATH, ["plan", "--spec=my-feature"], {
      reject: false,
      timeout: 10_000,
      cwd: tmpDir,
    });

    expect(result.stdout).not.toContain("███████");
  }, 15_000);

  it("ready command shows the logo", async () => {
    const result = await execaNode(CLI_PATH, ["ready"], {
      reject: false,
      timeout: 10_000,
      cwd: tmpDir,
    });

    expect(result.stdout).toContain("███████");
  }, 15_000);

  it("config show command shows the logo", async () => {
    const result = await execaNode(CLI_PATH, ["config", "show"], {
      reject: false,
      timeout: 10_000,
      cwd: tmpDir,
    });

    expect(result.stdout).toContain("███████");
  }, 15_000);
});
