import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { InstallStep } from "../InstallStep.js";

// Mock the install lib
vi.mock("../../lib/install.js", () => ({
  runPnpmInstall: vi.fn(),
}));

import { runPnpmInstall } from "../../lib/install.js";
const mockRunPnpmInstall = runPnpmInstall as ReturnType<typeof vi.fn>;

describe("InstallStep", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders section header", () => {
    mockRunPnpmInstall.mockResolvedValue({
      success: true,
    });
    const { lastFrame } = render(
      <InstallStep destination="/test" onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Installing Dependencies");
  });

  it("shows spinner while installing", () => {
    // Hang forever to keep in installing state
    mockRunPnpmInstall.mockImplementation(() => new Promise(() => {}));
    const { lastFrame } = render(
      <InstallStep destination="/test" onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Preparing to install dependencies...");
  });

  it("calls runPnpmInstall", () => {
    mockRunPnpmInstall.mockResolvedValue({
      success: true,
    });
    render(
      <InstallStep destination="/my-project" onComplete={() => {}} />
    );
    expect(mockRunPnpmInstall).toHaveBeenCalled();
  });

  it("shows success state after install completes", async () => {
    mockRunPnpmInstall.mockResolvedValue({
      success: true,
    });
    const { lastFrame } = render(
      <InstallStep destination="/test" onComplete={() => {}} />
    );
    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Dependencies installed successfully");
    });
  });

  it("calls onComplete after install succeeds", async () => {
    const handleComplete = vi.fn();
    mockRunPnpmInstall.mockResolvedValue({
      success: true,
    });
    render(
      <InstallStep destination="/test" onComplete={handleComplete} />
    );
    await vi.waitFor(() => {
      expect(handleComplete).toHaveBeenCalled();
    });
  });

  it("shows error state when install fails", async () => {
    mockRunPnpmInstall.mockResolvedValue({
      success: false,
      error: "Install failed",
    });
    const { lastFrame } = render(
      <InstallStep destination="/test" onComplete={() => {}} />
    );
    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Install failed");
    });
  });
});
