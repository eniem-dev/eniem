import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

import { execa } from "execa";
import {
  getAdapter,
  isValidCLI,
  listAvailable,
  checkBinary,
} from "../registry.js";
import { claudeAdapter } from "../claude.js";

describe("registry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAdapter", () => {
    it("returns the Claude adapter for 'claude'", () => {
      expect(getAdapter("claude")).toBe(claudeAdapter);
    });

    it("throws for unknown CLI id listing valid options", () => {
      expect(() => getAdapter("invalid")).toThrow(
        'Unknown CLI adapter "invalid". Available: claude',
      );
    });
  });

  describe("isValidCLI", () => {
    it("returns true for supported CLI ids", () => {
      expect(isValidCLI("claude")).toBe(true);
      expect(isValidCLI("codex")).toBe(true);
      expect(isValidCLI("gemini")).toBe(true);
      expect(isValidCLI("opencode")).toBe(true);
    });

    it("returns false for unsupported CLI ids", () => {
      expect(isValidCLI("invalid")).toBe(false);
      expect(isValidCLI("")).toBe(false);
    });
  });

  describe("checkBinary", () => {
    it("returns true when binary exists", async () => {
      vi.mocked(execa).mockResolvedValue(undefined as never);
      expect(await checkBinary("claude")).toBe(true);
      expect(execa).toHaveBeenCalledWith("claude", ["--version"]);
    });

    it("returns false when binary not found (ENOENT)", async () => {
      vi.mocked(execa).mockRejectedValue(
        Object.assign(new Error("not found"), { code: "ENOENT" }),
      );
      expect(await checkBinary("missing-bin")).toBe(false);
    });

    it("returns true for non-ENOENT errors (binary exists but failed)", async () => {
      vi.mocked(execa).mockRejectedValue(
        Object.assign(new Error("permission denied"), { code: "EACCES" }),
      );
      expect(await checkBinary("some-bin")).toBe(true);
    });
  });

  describe("listAvailable", () => {
    it("returns adapters whose binary is on PATH", async () => {
      vi.mocked(execa).mockResolvedValue(undefined as never);
      const available = await listAvailable();
      expect(available).toEqual([claudeAdapter]);
    });

    it("returns empty array when no binaries found", async () => {
      vi.mocked(execa).mockRejectedValue(
        Object.assign(new Error("not found"), { code: "ENOENT" }),
      );
      const available = await listAvailable();
      expect(available).toEqual([]);
    });
  });
});
