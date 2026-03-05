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

    it("clones repository via HTTPS by default", async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const onProgress = vi.fn();
      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
        onProgress,
      });

      expect(result.success).toBe(true);
      expect(result.destination).toBe("./my-project");
      expect(execa).toHaveBeenCalledWith(
        "git",
        ["clone", "--depth", "1", "https://github.com/eniem-dev/eniem-boilerplate.git", "./my-project"],
        expect.objectContaining({ env: expect.objectContaining({ GIT_TERMINAL_PROMPT: "0" }) }),
      );
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

      expect(execa).toHaveBeenCalledWith(
        "git",
        ["clone", "--depth", "1", "https://gitlab.com/eniem-dev/eniem-boilerplate.git", "./my-project"],
        expect.objectContaining({ env: expect.objectContaining({ GIT_TERMINAL_PROMPT: "0" }) }),
      );
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

    it("returns error when directory already exists", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("already exists"));

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Directory "my-project" already exists');
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

  describe("protocol='ssh'", () => {
    beforeEach(() => vi.clearAllMocks());
    afterEach(() => vi.restoreAllMocks());

    it("uses SSH URL when protocol is ssh", async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
        protocol: "ssh",
      });

      expect(result.success).toBe(true);
      expect(execa).toHaveBeenCalledWith(
        "git",
        ["clone", "--depth", "1", "git@github.com:eniem-dev/eniem-boilerplate.git", "./my-project"],
        expect.objectContaining({ env: expect.objectContaining({ GIT_TERMINAL_PROMPT: "0" }) }),
      );
    });

    it("reports progress for SSH clone", async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const onProgress = vi.fn();
      await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
        protocol: "ssh",
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledWith("Cloning boilerplate via SSH...");
      expect(onProgress).toHaveBeenCalledWith("Clone complete!");
    });
  });

  describe("protocol='https'", () => {
    beforeEach(() => vi.clearAllMocks());
    afterEach(() => vi.restoreAllMocks());

    it("uses HTTPS URL when protocol is https", async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
        protocol: "https",
      });

      expect(result.success).toBe(true);
      expect(execa).toHaveBeenCalledWith(
        "git",
        ["clone", "--depth", "1", "https://github.com/eniem-dev/eniem-boilerplate.git", "./my-project"],
        expect.objectContaining({ env: expect.objectContaining({ GIT_TERMINAL_PROMPT: "0" }) }),
      );
    });
  });

});
