import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CLIAdapter, CLIId } from "../adapters/types.js";
import { resolveCLI } from "../resolve-cli.js";

vi.mock("../eni-config.js");
vi.mock("../adapters/registry.js");

const { readConfig } = await import("../eni-config.js");
const { getAdapter, isValidCLI, listAvailable } = await import(
  "../adapters/registry.js"
);

const mockedReadConfig = vi.mocked(readConfig);
const mockedGetAdapter = vi.mocked(getAdapter);
const mockedIsValidCLI = vi.mocked(isValidCLI);
const mockedListAvailable = vi.mocked(listAvailable);

function makeAdapter(id: CLIId): CLIAdapter {
  return {
    id,
    name: `${id} adapter`,
    binary: id,
    run: vi.fn(),
  };
}

const claudeAdapter = makeAdapter("claude");
const codexAdapter = makeAdapter("codex");
const opencodeAdapter = makeAdapter("opencode");

const CWD = "/tmp/test-project";

beforeEach(() => {
  vi.clearAllMocks();

  mockedIsValidCLI.mockImplementation(
    (id: string) =>
      ["claude", "codex", "opencode"].includes(id) as boolean,
  );

  mockedGetAdapter.mockImplementation((id: string) => {
    const adapters: Record<string, CLIAdapter> = {
      claude: claudeAdapter,
      codex: codexAdapter,
      opencode: opencodeAdapter,
    };
    const adapter = adapters[id];
    if (!adapter) throw new Error(`Unknown CLI adapter "${id}"`);
    return adapter;
  });

  mockedListAvailable.mockResolvedValue([claudeAdapter, codexAdapter]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolveCLI", () => {
  describe("--cli flag resolution", () => {
    it("returns adapter from --cli flag when provided", async () => {
      const result = await resolveCLI({
        cliFlag: "codex",
        command: "plan",
        cwd: CWD,
      });

      expect(result).toEqual({
        resolved: true,
        adapter: codexAdapter,
        source: "flag",
      });
    });

    it("source is 'flag' when using --cli flag", async () => {
      const result = await resolveCLI({
        cliFlag: "claude",
        command: "build",
        cwd: CWD,
      });

      expect(result).toEqual(
        expect.objectContaining({ resolved: true, source: "flag" }),
      );
    });

    it("throws on invalid CLI name in flag", async () => {
      mockedIsValidCLI.mockReturnValue(false);

      await expect(
        resolveCLI({ cliFlag: "invalid", command: "plan", cwd: CWD }),
      ).rejects.toThrow(
        '"invalid" is not a valid CLI. Valid options: claude, codex, opencode',
      );
    });

    it("does not read config when flag is provided", async () => {
      await resolveCLI({ cliFlag: "claude", command: "plan", cwd: CWD });

      expect(mockedReadConfig).not.toHaveBeenCalled();
    });
  });

  describe("config file resolution", () => {
    it("returns adapter from config when flag not provided", async () => {
      mockedReadConfig.mockResolvedValue({ plan: "codex", build: "claude" });

      const result = await resolveCLI({ command: "plan", cwd: CWD });

      expect(result).toEqual({
        resolved: true,
        adapter: codexAdapter,
        source: "config",
      });
    });

    it("source is 'config' when using config value", async () => {
      mockedReadConfig.mockResolvedValue({ plan: "claude", build: "codex" });

      const result = await resolveCLI({ command: "build", cwd: CWD });

      expect(result).toEqual(
        expect.objectContaining({ resolved: true, source: "config" }),
      );
    });

    it("defaults to 'claude' when config key is missing", async () => {
      mockedReadConfig.mockResolvedValue({ plan: "codex" }); // no build key

      const result = await resolveCLI({ command: "build", cwd: CWD });

      expect(result).toEqual({
        resolved: true,
        adapter: claudeAdapter,
        source: "default",
      });
    });

    it("defaults to 'claude' when config is empty {}", async () => {
      mockedReadConfig.mockResolvedValue({});

      const result = await resolveCLI({ command: "plan", cwd: CWD });

      expect(result).toEqual({
        resolved: true,
        adapter: claudeAdapter,
        source: "default",
      });
    });
  });

  describe("first-run prompt", () => {
    it("returns needsFirstRun when no config file exists", async () => {
      mockedReadConfig.mockResolvedValue(null);

      const result = await resolveCLI({ command: "plan", cwd: CWD });

      expect(result).toEqual({
        needsFirstRun: true,
        available: [claudeAdapter, codexAdapter],
      });
    });

    it("returns noClisAvailable when no config and no binaries found", async () => {
      mockedReadConfig.mockResolvedValue(null);
      mockedListAvailable.mockResolvedValue([]);

      const result = await resolveCLI({ command: "plan", cwd: CWD });

      expect(result).toEqual({ noClisAvailable: true });
    });
  });

  describe("missing binary fallback", () => {
    it("returns needsFallback when binary not on PATH", async () => {
      mockedReadConfig.mockResolvedValue({
        plan: "opencode",
        build: "opencode",
      });
      // opencode is not in the available list
      mockedListAvailable.mockResolvedValue([claudeAdapter, codexAdapter]);

      const result = await resolveCLI({ command: "plan", cwd: CWD });

      expect(result).toEqual({
        needsFallback: true,
        configured: "opencode",
        available: [claudeAdapter, codexAdapter],
      });
    });

    it("returns needsFallback when flag binary not on PATH", async () => {
      // opencode not in available list
      mockedListAvailable.mockResolvedValue([claudeAdapter, codexAdapter]);

      const result = await resolveCLI({
        cliFlag: "opencode",
        command: "build",
        cwd: CWD,
      });

      expect(result).toEqual({
        needsFallback: true,
        configured: "opencode",
        available: [claudeAdapter, codexAdapter],
      });
    });

    it("returns noClisAvailable when no binaries found at all", async () => {
      mockedReadConfig.mockResolvedValue({ plan: "opencode" });
      mockedListAvailable.mockResolvedValue([]);

      const result = await resolveCLI({ command: "plan", cwd: CWD });

      expect(result).toEqual({ noClisAvailable: true });
    });
  });
});
