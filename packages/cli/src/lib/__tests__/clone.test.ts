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
      expect(execa).toHaveBeenCalledWith(
        "git",
        ["clone", "--depth", "1", "git@github.com:eniem-dev/eniem-boilerplate.git", "./my-project"],
        { timeout: 10_000 },
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
        ["clone", "--depth", "1", "git@gitlab.com:eniem-dev/eniem-boilerplate.git", "./my-project"],
        { timeout: 10_000 },
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
        {},
      );
    });

    it("reports progress for HTTPS clone", async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const onProgress = vi.fn();
      await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
        protocol: "https",
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledWith("Cloning boilerplate via HTTPS...");
      expect(onProgress).toHaveBeenCalledWith("Clone complete!");
    });

    it("returns error when HTTPS clone fails", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("Authentication failed"));

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
        protocol: "https",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to clone repository");
      expect(result.error).toContain("Authentication failed");
    });
  });

  describe("protocol='ssh'", () => {
    beforeEach(() => vi.clearAllMocks());
    afterEach(() => vi.restoreAllMocks());

    it("uses SSH URL with no fallback", async () => {
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
        {},
      );
    });

    it("does not fallback to HTTPS on network error", async () => {
      const error = Object.assign(new Error("Connection refused"), { timedOut: false });
      vi.mocked(execa).mockRejectedValueOnce(error);

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
        protocol: "ssh",
      });

      expect(result.success).toBe(false);
      expect(execa).toHaveBeenCalledTimes(1);
    });
  });

  describe("default protocol (SSH with HTTPS fallback)", () => {
    beforeEach(() => vi.clearAllMocks());
    afterEach(() => vi.restoreAllMocks());

    it("succeeds via SSH without fallback", async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBeUndefined();
      expect(execa).toHaveBeenCalledTimes(1);
    });

    it("falls back to HTTPS on SSH timeout", async () => {
      const timeoutError = Object.assign(new Error("Timed out"), { timedOut: true });
      vi.mocked(execa)
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce({} as never);

      const onProgress = vi.fn();
      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
        onProgress,
      });

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true);
      expect(execa).toHaveBeenCalledTimes(2);
      expect(onProgress).toHaveBeenCalledWith("SSH timed out, switching to HTTPS...");
      // Second call should be HTTPS
      expect(execa).toHaveBeenLastCalledWith(
        "git",
        ["clone", "--depth", "1", "https://github.com/eniem-dev/eniem-boilerplate.git", "./my-project"],
        {},
      );
    });

    it("falls back to HTTPS on SSH connection refused", async () => {
      vi.mocked(execa)
        .mockRejectedValueOnce(new Error("Connection refused"))
        .mockResolvedValueOnce({} as never);

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true);
      expect(execa).toHaveBeenCalledTimes(2);
    });

    it("falls back to HTTPS on SSH ECONNREFUSED", async () => {
      vi.mocked(execa)
        .mockRejectedValueOnce(new Error("ECONNREFUSED"))
        .mockResolvedValueOnce({} as never);

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true);
    });

    it("falls back to HTTPS on DNS resolution error", async () => {
      vi.mocked(execa)
        .mockRejectedValueOnce(new Error("Could not resolve hostname"))
        .mockResolvedValueOnce({} as never);

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true);
    });

    it("falls back to HTTPS on ENOTFOUND", async () => {
      vi.mocked(execa)
        .mockRejectedValueOnce(new Error("ENOTFOUND"))
        .mockResolvedValueOnce({} as never);

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true);
    });

    it("shows both errors when SSH times out and HTTPS also fails", async () => {
      const timeoutError = Object.assign(new Error("Timed out"), { timedOut: true });
      vi.mocked(execa)
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(new Error("Authentication failed"));

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Could not clone the repository");
      expect(result.error).toContain("SSH:");
      expect(result.error).toContain("Timed out after 10s");
      expect(result.error).toContain("HTTPS:");
      expect(result.error).toContain("Authentication failed");
    });

    it("shows both errors when SSH network error and HTTPS also fails", async () => {
      vi.mocked(execa)
        .mockRejectedValueOnce(new Error("ECONNREFUSED"))
        .mockRejectedValueOnce(new Error("HTTPS failed too"));

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Could not clone the repository");
      expect(result.error).toContain("SSH:");
      expect(result.error).toContain("ECONNREFUSED");
      expect(result.error).toContain("HTTPS:");
      expect(result.error).toContain("HTTPS failed too");
    });

    it("does NOT fallback on SSH auth/permission error", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("Permission denied"));

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("SSH access denied");
      expect(execa).toHaveBeenCalledTimes(1);
    });

    it("does NOT fallback on 'Could not read from remote repository'", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("Could not read from remote repository"));

      const result = await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("SSH access denied");
      expect(execa).toHaveBeenCalledTimes(1);
    });

    it("uses 10s timeout for SSH in default mode", async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      await cloneBoilerplate({
        projectName: "my-project",
        gitHost: "github.com",
      });

      expect(execa).toHaveBeenCalledWith(
        "git",
        expect.any(Array),
        { timeout: 10_000 },
      );
    });
  });
});
