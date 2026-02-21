import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initGitRepo } from "../git.js";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  rm: vi.fn(),
}));

import { execa } from "execa";
import { rm } from "fs/promises";

describe("git", () => {
  describe("initGitRepo", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("initializes git repo successfully", async () => {
      vi.mocked(rm).mockResolvedValueOnce(undefined);
      vi.mocked(execa)
        .mockResolvedValueOnce({} as never) // git init
        .mockResolvedValueOnce({} as never) // git add .
        .mockResolvedValueOnce({} as never); // git commit

      const onProgress = vi.fn();
      const result = await initGitRepo({
        destination: "/project",
        onProgress,
      });

      expect(result.success).toBe(true);
      expect(rm).toHaveBeenCalledWith("/project/.git", { recursive: true, force: true });
      expect(execa).toHaveBeenCalledWith("git", ["init"], { cwd: "/project" });
      expect(execa).toHaveBeenCalledWith("git", ["add", "."], { cwd: "/project" });
      expect(execa).toHaveBeenCalledWith("git", ["commit", "-m", "Initial commit from eni"], {
        cwd: "/project",
      });
    });

    it("calls onProgress callbacks", async () => {
      vi.mocked(rm).mockResolvedValueOnce(undefined);
      vi.mocked(execa)
        .mockResolvedValueOnce({} as never)
        .mockResolvedValueOnce({} as never)
        .mockResolvedValueOnce({} as never);

      const onProgress = vi.fn();
      await initGitRepo({
        destination: "/project",
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledWith("Removing existing .git directory...");
      expect(onProgress).toHaveBeenCalledWith("Initializing fresh git repository...");
      expect(onProgress).toHaveBeenCalledWith("Staging files...");
      expect(onProgress).toHaveBeenCalledWith("Creating initial commit...");
      expect(onProgress).toHaveBeenCalledWith("Git repository initialized!");
    });

    it("works without onProgress callback", async () => {
      vi.mocked(rm).mockResolvedValueOnce(undefined);
      vi.mocked(execa)
        .mockResolvedValueOnce({} as never)
        .mockResolvedValueOnce({} as never)
        .mockResolvedValueOnce({} as never);

      const result = await initGitRepo({
        destination: "/project",
      });

      expect(result.success).toBe(true);
    });

    it("continues if .git directory does not exist", async () => {
      vi.mocked(rm).mockRejectedValueOnce(new Error("ENOENT"));
      vi.mocked(execa)
        .mockResolvedValueOnce({} as never)
        .mockResolvedValueOnce({} as never)
        .mockResolvedValueOnce({} as never);

      const result = await initGitRepo({
        destination: "/project",
      });

      expect(result.success).toBe(true);
    });

    it("returns error when not a git repository", async () => {
      vi.mocked(rm).mockResolvedValueOnce(undefined);
      vi.mocked(execa).mockRejectedValueOnce(new Error("not a git repository"));

      const result = await initGitRepo({
        destination: "/project",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to initialize git repository");
      expect(result.error).toContain("ensure git is installed");
    });

    it("returns error when git not found", async () => {
      vi.mocked(rm).mockResolvedValueOnce(undefined);
      vi.mocked(execa).mockRejectedValueOnce(new Error("ENOENT"));

      const result = await initGitRepo({
        destination: "/project",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Git command not found");
    });

    it("returns generic error for other failures", async () => {
      vi.mocked(rm).mockResolvedValueOnce(undefined);
      vi.mocked(execa).mockRejectedValueOnce(new Error("Some other error"));

      const result = await initGitRepo({
        destination: "/project",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to initialize git repository");
      expect(result.error).toContain("Some other error");
    });

    it("handles non-Error exceptions", async () => {
      vi.mocked(rm).mockResolvedValueOnce(undefined);
      vi.mocked(execa).mockRejectedValueOnce("Unknown error");

      const result = await initGitRepo({
        destination: "/project",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown error occurred");
    });
  });
});
