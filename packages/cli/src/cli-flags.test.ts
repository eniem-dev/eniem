import { describe, it, expect } from "vitest";
import { execaNode } from "execa";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

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
  }, 15_000);
});
