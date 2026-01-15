import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runPnpmInstall } from "../install.js";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

import { execa } from "execa";

describe("install", () => {
  describe("runPnpmInstall", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("installs dependencies successfully", async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const onProgress = vi.fn();
      const result = await runPnpmInstall({
        destination: "/project",
        onProgress,
      });

      expect(result.success).toBe(true);
      expect(execa).toHaveBeenCalledWith("pnpm", ["install"], {
        cwd: "/project",
        stdio: "pipe",
      });
    });

    it("calls onProgress callbacks", async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const onProgress = vi.fn();
      await runPnpmInstall({
        destination: "/project",
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledWith("Installing dependencies with pnpm...");
      expect(onProgress).toHaveBeenCalledWith("Dependencies installed successfully!");
    });

    it("works without onProgress callback", async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const result = await runPnpmInstall({
        destination: "/project",
      });

      expect(result.success).toBe(true);
    });

    it("returns error when pnpm not found", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("ENOENT"));

      const result = await runPnpmInstall({
        destination: "/project",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("pnpm command not found");
    });

    it("returns error for network ECONNREFUSED", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("ECONNREFUSED"));

      const result = await runPnpmInstall({
        destination: "/project",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });

    it("returns error for network ENOTFOUND", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("ENOTFOUND"));

      const result = await runPnpmInstall({
        destination: "/project",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });

    it("returns generic error for other failures", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("Some other error"));

      const result = await runPnpmInstall({
        destination: "/project",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to install dependencies");
      expect(result.error).toContain("Some other error");
    });

    it("handles non-Error exceptions", async () => {
      vi.mocked(execa).mockRejectedValueOnce("Unknown error");

      const result = await runPnpmInstall({
        destination: "/project",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown error occurred");
    });
  });
});
