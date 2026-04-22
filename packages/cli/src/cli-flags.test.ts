import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execaNode } from "execa";
import { fileURLToPath } from "url";
import { dirname, resolve, join } from "path";
import { mkdtemp, rm } from "fs/promises";
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

describe("CLI help text", () => {
  it("lists only the surviving commands", async () => {
    const result = await execaNode(CLI_PATH, ["--help"], {
      reject: false,
      timeout: 10_000,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("eni [project-name]");
    expect(result.stdout).toContain("eni ready");
    expect(result.stdout).toContain("eni products");
    expect(result.stdout).not.toContain("eni plan");
    expect(result.stdout).not.toContain("eni build");
    expect(result.stdout).not.toContain("eni ai init");
    expect(result.stdout).not.toContain("eni config");
  }, 15_000);
});

describe("CLI header", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "eni-header-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("ready command shows the logo", async () => {
    const result = await execaNode(CLI_PATH, ["ready"], {
      reject: false,
      timeout: 10_000,
      cwd: tmpDir,
    });

    expect(result.stdout).toContain("███████");
  }, 15_000);
});
