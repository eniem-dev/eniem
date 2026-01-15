import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cloneBoilerplate } from "../clone.js";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

import { execa } from "execa";

describe("clone", () => {
  describe("cloneBoilerplate", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("clones repository successfully", async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const onProgress = vi.fn();
      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
        onProgress,
      });

      expect(result.success).toBe(true);
      expect(result.destination).toBe("./my-project");
      expect(execa).toHaveBeenCalledWith("git", [
        "clone",
        "--depth",
        "1",
        "git@github.com:eniem-dev/eniem-boilerplate.git",
        "./my-project",
      ]);
    });

    it("calls onProgress callbacks", async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const onProgress = vi.fn();
      await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledWith("Cloning boilerplate repository...");
      expect(onProgress).toHaveBeenCalledWith("Clone complete!");
    });

    it("works without onProgress callback", async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(true);
    });

    it("uses custom git host", async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "gitlab.com",
      });

      expect(execa).toHaveBeenCalledWith("git", [
        "clone",
        "--depth",
        "1",
        "git@gitlab.com:eniem-dev/eniem-boilerplate.git",
        "./my-project",
      ]);
    });

    it("returns error when git not installed", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("ENOENT"));

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Git is not installed");
    });

    it("returns error for permission denied", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("Permission denied"));

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("SSH access denied");
    });

    it("returns error for could not read from remote repository", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("Could not read from remote repository"));

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("SSH access denied");
    });

    it("returns error for repository not found", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("Repository not found"));

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Repository not found");
    });

    it("returns error for does not exist", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("does not exist"));

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Repository not found");
    });

    it("returns error when directory already exists", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("already exists"));

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Directory "my-project" already exists');
    });

    it("returns error for network ENOTFOUND", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("ENOTFOUND"));

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });

    it("returns error for network ECONNREFUSED", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("ECONNREFUSED"));

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });

    it("returns error for could not resolve hostname", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("Could not resolve hostname"));

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });

    it("returns generic error for other failures", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("Some other error"));

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to clone repository");
      expect(result.error).toContain("Some other error");
    });

    it("handles non-Error exceptions", async () => {
      vi.mocked(execa).mockRejectedValueOnce("Unknown error");

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown error occurred");
    });
  });
});
