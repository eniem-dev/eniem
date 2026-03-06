import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { CloneStep } from "../CloneStep.js";

// Mock the clone lib
vi.mock("../../lib/clone.js", () => ({
  cloneBoilerplate: vi.fn(),
}));

import { cloneBoilerplate } from "../../lib/clone.js";
const mockCloneBoilerplate = cloneBoilerplate as ReturnType<typeof vi.fn>;

describe("CloneStep", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders section header", () => {
    mockCloneBoilerplate.mockResolvedValue({
      success: true,
      destination: "/path/to/test-project",
    });
    const { lastFrame } = render(
      <CloneStep projectName="test-project" gitHost="github" onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Cloning Boilerplate");
  });

  it("shows spinner while cloning", () => {
    // Hang forever to keep in cloning state
    mockCloneBoilerplate.mockImplementation(() => new Promise(() => {}));
    const { lastFrame } = render(
      <CloneStep projectName="test-project" gitHost="github" onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Initializing...");
  });

  it("calls cloneBoilerplate", () => {
    mockCloneBoilerplate.mockResolvedValue({
      success: true,
      destination: "/test",
    });
    render(
      <CloneStep projectName="my-app" gitHost="github" onComplete={() => {}} />
    );
    expect(mockCloneBoilerplate).toHaveBeenCalled();
  });

  it("shows success state after clone completes", async () => {
    mockCloneBoilerplate.mockResolvedValue({
      success: true,
      destination: "/path/to/test-project",
    });
    const { lastFrame } = render(
      <CloneStep projectName="test-project" gitHost="github" onComplete={() => {}} />
    );
    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Project cloned");
    });
  });

  it("calls onComplete after clone succeeds", async () => {
    const handleComplete = vi.fn();
    mockCloneBoilerplate.mockResolvedValue({
      success: true,
      destination: "/path/to/test-project",
    });
    render(
      <CloneStep projectName="test-project" gitHost="github" onComplete={handleComplete} />
    );
    await vi.waitFor(() => {
      expect(handleComplete).toHaveBeenCalledWith("/path/to/test-project");
    });
  });

  it("shows error state when clone fails", async () => {
    mockCloneBoilerplate.mockResolvedValue({
      success: false,
      error: "Clone failed",
    });
    const { lastFrame } = render(
      <CloneStep projectName="test-project" gitHost="github" onComplete={() => {}} />
    );
    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Clone failed");
    });
  });

  it("passes protocol to cloneBoilerplate", async () => {
    mockCloneBoilerplate.mockResolvedValue({
      success: true,
      destination: "/path/to/test-project",
    });
    render(
      <CloneStep projectName="test-project" gitHost="github" protocol="ssh" onComplete={() => {}} />
    );
    await vi.waitFor(() => {
      expect(mockCloneBoilerplate).toHaveBeenCalledWith(
        expect.objectContaining({ protocol: "ssh" })
      );
    });
  });
});
