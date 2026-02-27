import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readConfig, validateConfig, writeConfig } from "../eni-config.js";

vi.mock("fs/promises");

const mockedReadFile = vi.mocked(readFile);
const mockedWriteFile = vi.mocked(writeFile);
const mockedMkdir = vi.mocked(mkdir);

const CWD = "/tmp/test-project";
const CONFIG_PATH = join(CWD, ".eni", "config.json");

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("readConfig", () => {
  it("returns parsed config when file exists", async () => {
    mockedReadFile.mockResolvedValue(
      JSON.stringify({ plan: "claude", build: "codex" }),
    );

    const config = await readConfig(CWD);

    expect(config).toEqual({ plan: "claude", build: "codex" });
    expect(mockedReadFile).toHaveBeenCalledWith(CONFIG_PATH, "utf-8");
  });

  it("returns null when file doesn't exist", async () => {
    const error = new Error("ENOENT") as NodeJS.ErrnoException;
    error.code = "ENOENT";
    mockedReadFile.mockRejectedValue(error);

    const config = await readConfig(CWD);

    expect(config).toBeNull();
  });

  it("returns config without verbose when key is absent in file", async () => {
    mockedReadFile.mockResolvedValue(JSON.stringify({ plan: "claude" }));

    const config = await readConfig(CWD);

    expect(config).toEqual({ plan: "claude" });
    expect(config?.verbose).toBeUndefined();
  });

  it("throws on invalid JSON with helpful message", async () => {
    mockedReadFile.mockResolvedValue("{ not valid json }");

    await expect(readConfig(CWD)).rejects.toThrow(
      /Invalid JSON in .eni\/config.json.*Fix or delete the file/,
    );
  });
});

describe("writeConfig", () => {
  it("creates .eni/ directory if missing", async () => {
    mockedMkdir.mockResolvedValue(undefined);
    mockedWriteFile.mockResolvedValue();

    await writeConfig(CWD, { plan: "claude" });

    expect(mockedMkdir).toHaveBeenCalledWith(join(CWD, ".eni"), {
      recursive: true,
    });
  });

  it("writes valid JSON to .eni/config.json", async () => {
    mockedMkdir.mockResolvedValue(undefined);
    mockedWriteFile.mockResolvedValue();

    await writeConfig(CWD, { plan: "gemini", build: "codex" });

    expect(mockedWriteFile).toHaveBeenCalledWith(
      CONFIG_PATH,
      JSON.stringify({ plan: "gemini", build: "codex" }, null, 2) + "\n",
    );
  });

  it("writes verbose field to config file", async () => {
    mockedMkdir.mockResolvedValue(undefined);
    mockedWriteFile.mockResolvedValue();

    await writeConfig(CWD, { plan: "claude", verbose: true });

    expect(mockedWriteFile).toHaveBeenCalledWith(
      CONFIG_PATH,
      JSON.stringify({ plan: "claude", verbose: true }, null, 2) + "\n",
    );
  });
});

describe("validateConfig", () => {
  it('accepts { plan: "claude", build: "codex" }', () => {
    const result = validateConfig({ plan: "claude", build: "codex" });
    expect(result).toEqual({ plan: "claude", build: "codex" });
  });

  it("accepts {} (empty)", () => {
    const result = validateConfig({});
    expect(result).toEqual({});
  });

  it('rejects { plan: "invalid" } with error listing valid CLIs', () => {
    expect(() => validateConfig({ plan: "invalid" })).toThrow(
      /must be one of: claude, codex, gemini, opencode.*got "invalid"/,
    );
  });

  it("accepts { verbose: true }", () => {
    const result = validateConfig({ verbose: true });
    expect(result).toEqual({ verbose: true });
  });

  it("accepts { verbose: false }", () => {
    const result = validateConfig({ verbose: false });
    expect(result).toEqual({ verbose: false });
  });

  it("returns config without verbose when key is missing", () => {
    const result = validateConfig({ plan: "claude" });
    expect(result).toEqual({ plan: "claude" });
    expect(result.verbose).toBeUndefined();
  });

  it('rejects { verbose: "yes" } with error', () => {
    expect(() => validateConfig({ verbose: "yes" })).toThrow(
      /verbose.*must be a boolean.*got "yes"/,
    );
  });

  it("rejects { verbose: 1 } with error", () => {
    expect(() => validateConfig({ verbose: 1 })).toThrow(
      /verbose.*must be a boolean.*got "1"/,
    );
  });

  it("rejects non-object values", () => {
    expect(() => validateConfig("string")).toThrow(
      "Invalid config: expected a JSON object {}",
    );
    expect(() => validateConfig(null)).toThrow(
      "Invalid config: expected a JSON object {}",
    );
    expect(() => validateConfig([])).toThrow(
      "Invalid config: expected a JSON object {}",
    );
  });
});
