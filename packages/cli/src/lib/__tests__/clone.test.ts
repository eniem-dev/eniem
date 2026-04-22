import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cloneBoilerplate } from "../clone.js";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

import { execa } from "execa";

const enoent = () => {
  const err = new Error("spawn ENOENT") as NodeJS.ErrnoException;
  err.code = "ENOENT";
  return err;
};

describe("cloneBoilerplate — auto path (no flags)", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("tries gh first and succeeds", async () => {
    vi.mocked(execa).mockResolvedValueOnce({} as never);

    const result = await cloneBoilerplate({ projectName: "my-project" });

    expect(result.success).toBe(true);
    expect(result.destination).toBe("./my-project");
    expect(execa).toHaveBeenCalledTimes(1);
    expect(execa).toHaveBeenNthCalledWith(
      1,
      "gh",
      ["repo", "clone", "eniem-dev/eniem-boilerplate", "./my-project", "--", "--depth", "1"],
    );
  });

  it("falls back to git HTTPS when gh is not installed", async () => {
    vi.mocked(execa).mockRejectedValueOnce(enoent()).mockResolvedValueOnce({} as never);

    const result = await cloneBoilerplate({ projectName: "my-project" });

    expect(result.success).toBe(true);
    expect(execa).toHaveBeenCalledTimes(2);
    expect(execa).toHaveBeenNthCalledWith(
      2,
      "git",
      ["clone", "--depth", "1", "https://github.com/eniem-dev/eniem-boilerplate.git", "./my-project"],
      expect.objectContaining({ env: expect.objectContaining({ GIT_TERMINAL_PROMPT: "0" }) }),
    );
  });

  it("falls back to git HTTPS when gh fails for any other reason (auth)", async () => {
    vi.mocked(execa)
      .mockRejectedValueOnce(new Error("authentication failed"))
      .mockResolvedValueOnce({} as never);

    const result = await cloneBoilerplate({ projectName: "my-project" });

    expect(result.success).toBe(true);
    expect(execa).toHaveBeenCalledTimes(2);
  });

  it("returns combined error when both gh and git fail", async () => {
    vi.mocked(execa)
      .mockRejectedValueOnce(new Error("auth failed"))
      .mockRejectedValueOnce(new Error("network unreachable"));

    const result = await cloneBoilerplate({ projectName: "my-project" });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Tried gh:");
    expect(result.error).toContain("auth failed");
    expect(result.error).toContain("Tried git HTTPS:");
    expect(result.error).toContain("network unreachable");
  });

  it("returns directory-conflict error when gh reports 'already exists'", async () => {
    vi.mocked(execa).mockRejectedValueOnce(new Error("fatal: destination already exists"));

    const result = await cloneBoilerplate({ projectName: "my-project" });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Directory "my-project" already exists');
    expect(execa).toHaveBeenCalledTimes(1);
  });

  it("returns directory-conflict error when git fallback reports 'already exists'", async () => {
    vi.mocked(execa)
      .mockRejectedValueOnce(enoent())
      .mockRejectedValueOnce(new Error("already exists"));

    const result = await cloneBoilerplate({ projectName: "my-project" });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Directory "my-project" already exists');
  });

  it("fires onProgress for both attempts during fallback", async () => {
    vi.mocked(execa).mockRejectedValueOnce(enoent()).mockResolvedValueOnce({} as never);

    const onProgress = vi.fn();
    await cloneBoilerplate({ projectName: "my-project", onProgress });

    expect(onProgress).toHaveBeenCalledWith("Cloning with gh...");
    expect(onProgress).toHaveBeenCalledWith("Falling back to git HTTPS...");
    expect(onProgress).toHaveBeenCalledWith("Clone complete!");
  });
});

describe("cloneBoilerplate — SSH path", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("uses git SSH URL with default host when ssh=true and no host", async () => {
    vi.mocked(execa).mockResolvedValueOnce({} as never);

    const result = await cloneBoilerplate({ projectName: "my-project", ssh: true });

    expect(result.success).toBe(true);
    expect(execa).toHaveBeenCalledTimes(1);
    expect(execa).toHaveBeenCalledWith(
      "git",
      ["clone", "--depth", "1", "git@github.com:eniem-dev/eniem-boilerplate.git", "./my-project"],
      expect.objectContaining({ env: expect.objectContaining({ GIT_TERMINAL_PROMPT: "0" }) }),
    );
  });

  it("uses custom host in SSH URL", async () => {
    vi.mocked(execa).mockResolvedValueOnce({} as never);

    await cloneBoilerplate({ projectName: "my-project", ssh: true, gitHost: "github.com-work" });

    expect(execa).toHaveBeenCalledWith(
      "git",
      ["clone", "--depth", "1", "git@github.com-work:eniem-dev/eniem-boilerplate.git", "./my-project"],
      expect.objectContaining({ env: expect.objectContaining({ GIT_TERMINAL_PROMPT: "0" }) }),
    );
  });

  it("returns 'Git is not installed' error on ENOENT", async () => {
    vi.mocked(execa).mockRejectedValueOnce(enoent());

    const result = await cloneBoilerplate({ projectName: "my-project", ssh: true });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Git is not installed");
  });

  it("returns directory-conflict error on 'already exists'", async () => {
    vi.mocked(execa).mockRejectedValueOnce(new Error("already exists"));

    const result = await cloneBoilerplate({ projectName: "my-project", ssh: true });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Directory "my-project" already exists');
  });

  it("returns generic error for other failures", async () => {
    vi.mocked(execa).mockRejectedValueOnce(new Error("permission denied (publickey)"));

    const result = await cloneBoilerplate({ projectName: "my-project", ssh: true });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to clone repository");
    expect(result.error).toContain("permission denied (publickey)");
  });

  it("fires onProgress for SSH clone", async () => {
    vi.mocked(execa).mockResolvedValueOnce({} as never);

    const onProgress = vi.fn();
    await cloneBoilerplate({ projectName: "my-project", ssh: true, onProgress });

    expect(onProgress).toHaveBeenCalledWith("Cloning via SSH...");
    expect(onProgress).toHaveBeenCalledWith("Clone complete!");
  });
});
