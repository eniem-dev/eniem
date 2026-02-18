import { describe, it, expect } from "vitest";
import { execFile } from "child_process";
import { promisify } from "util";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const execFileAsync = promisify(execFile);

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliPath = resolve(__dirname, "../../dist/cli.js");
const pkgPath = resolve(__dirname, "../../package.json");

const require = createRequire(import.meta.url);
const pkg = require(pkgPath) as { version: string };

async function runCli(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await execFileAsync("node", [cliPath, ...args], {
      timeout: 10_000,
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: err.stdout ?? "",
      stderr: err.stderr ?? "",
      exitCode: err.code ?? 1,
    };
  }
}

describe("eni CLI routing", () => {
  describe("eni version", () => {
    it("prints the package version", async () => {
      const result = await runCli(["version"]);
      expect(result.stdout.trim()).toBe(pkg.version);
      expect(result.exitCode).toBe(0);
    });

    it("prints the package version with --version flag", async () => {
      const result = await runCli(["--version"]);
      expect(result.stdout.trim()).toBe(pkg.version);
      expect(result.exitCode).toBe(0);
    });
  });

  describe("eni help", () => {
    it("contains all expected command names", async () => {
      const result = await runCli(["help"]);
      const output = result.stdout;
      expect(output).toContain("eni project");
      expect(output).toContain("eni products");
      expect(output).toContain("eni ai setup");
      expect(output).toContain("eni ai plan");
      expect(output).toContain("eni ai build");
      expect(output).toContain("eni land");
      expect(output).toContain("eni doctor");
      expect(output).toContain("eni status");
      expect(output).toContain("eni version");
      expect(output).toContain("eni help");
      expect(result.exitCode).toBe(0);
    });

    it("prints help with --help flag", async () => {
      const result = await runCli(["--help"]);
      expect(result.stdout).toContain("eni project");
      expect(result.exitCode).toBe(0);
    });
  });

  describe("eni (no args)", () => {
    it("shows help when no command is given", async () => {
      const result = await runCli([]);
      expect(result.stdout).toContain("eni project");
      expect(result.stdout).toContain("eni help");
      expect(result.exitCode).toBe(0);
    });
  });

  describe("unknown commands", () => {
    it("shows error and help text for unknown command", async () => {
      const result = await runCli(["foobar"]);
      expect(result.stderr).toContain("Unknown command: foobar");
      expect(result.stdout).toContain("eni project");
      expect(result.exitCode).toBe(1);
    });
  });

  describe("stub commands", () => {
    // eni land is tested via unit tests — integration test skipped because
    // the command runs bd sync + git push which require a real environment

    it("eni doctor runs health checks", async () => {
      const result = await runCli(["doctor"]);
      // Doctor always prints a summary line with check counts
      expect(result.stdout).toMatch(/\d+\/\d+ checks passed/);
    });

    it("eni status prints not yet implemented", async () => {
      const result = await runCli(["status"]);
      expect(result.stdout).toContain("not yet implemented");
      expect(result.exitCode).toBe(0);
    });

    it("eni ai plan runs preflight checks", async () => {
      const result = await runCli(["ai", "plan"]);
      // Without .eni/ directory, preflight fails
      expect(result.stderr).toContain("eni ai setup");
      expect(result.exitCode).toBe(1);
    });

    it("eni ai build runs preflight checks", async () => {
      const result = await runCli(["ai", "build"]);
      // Without .eni/ directory, preflight fails
      expect(result.stderr).toContain("eni ai setup");
      expect(result.exitCode).toBe(1);
    });
  });

  describe("ai subcommand routing", () => {
    it("shows error for unknown ai subcommand", async () => {
      const result = await runCli(["ai", "unknown"]);
      expect(result.stderr).toContain("Unknown ai subcommand: unknown");
      expect(result.exitCode).toBe(1);
    });

    it("shows error for ai with no subcommand", async () => {
      const result = await runCli(["ai"]);
      expect(result.stderr).toContain("Unknown ai subcommand");
      expect(result.exitCode).toBe(1);
    });
  });
});
