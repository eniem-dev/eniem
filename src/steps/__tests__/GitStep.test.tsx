import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { GitStep } from "../GitStep.js";

// Mock the git lib
vi.mock("../../lib/git.js", () => ({
  initGitRepo: vi.fn(),
}));

import { initGitRepo } from "../../lib/git.js";
const mockInitGitRepo = initGitRepo as ReturnType<typeof vi.fn>;

describe("GitStep", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders section header", () => {
    mockInitGitRepo.mockResolvedValue({
      success: true,
    });
    const { lastFrame } = render(
      <GitStep destination="/test" onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Git Repository");
  });

  it("shows spinner while initializing", () => {
    // Hang forever to keep in initializing state
    mockInitGitRepo.mockImplementation(() => new Promise(() => {}));
    const { lastFrame } = render(
      <GitStep destination="/test" onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Preparing git repository...");
  });

  it("calls initGitRepo", () => {
    mockInitGitRepo.mockResolvedValue({
      success: true,
    });
    render(
      <GitStep destination="/my-project" onComplete={() => {}} />
    );
    expect(mockInitGitRepo).toHaveBeenCalled();
  });

  it("shows success state after git repo is initialized", async () => {
    mockInitGitRepo.mockResolvedValue({
      success: true,
    });
    const { lastFrame } = render(
      <GitStep destination="/test" onComplete={() => {}} />
    );
    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Fresh git repository initialized");
    });
  });

  it("calls onComplete after git repo is initialized", async () => {
    const handleComplete = vi.fn();
    mockInitGitRepo.mockResolvedValue({
      success: true,
    });
    render(
      <GitStep destination="/test" onComplete={handleComplete} />
    );
    await vi.waitFor(() => {
      expect(handleComplete).toHaveBeenCalled();
    });
  });

  it("shows error state when git initialization fails", async () => {
    mockInitGitRepo.mockResolvedValue({
      success: false,
      error: "Git init failed",
    });
    const { lastFrame } = render(
      <GitStep destination="/test" onComplete={() => {}} />
    );
    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Git init failed");
    });
  });
});
