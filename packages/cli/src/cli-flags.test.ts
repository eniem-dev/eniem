import { describe, it, expect } from "vitest";
import { execaNode } from "execa";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = resolve(__dirname, "../dist/cli.js");

describe("CLI --app-name flag", () => {
  it("exits with error when --app-name is empty string", async () => {
    const result = await execaNode(CLI_PATH, ["my-app", "--app-name", ""], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("--app-name cannot be empty");
  });
});
