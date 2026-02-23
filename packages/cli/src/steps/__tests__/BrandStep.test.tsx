import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { BrandStep } from "../BrandStep.js";

// Mock the replace lib
vi.mock("../../lib/replace.js", () => ({
  replacePlaceholders: vi.fn(),
}));

import { replacePlaceholders } from "../../lib/replace.js";
const mockReplacePlaceholders = replacePlaceholders as ReturnType<typeof vi.fn>;

const defaultProps = {
  destination: "/test-project",
  slug: "acme",
  appName: "Acme",
  onComplete: () => {},
};

describe("BrandStep", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders spinner while replacing", () => {
    mockReplacePlaceholders.mockImplementation(() => new Promise(() => {}));
    const { lastFrame } = render(<BrandStep {...defaultProps} />);
    expect(lastFrame()).toContain("Replacing placeholders...");
  });

  it("shows success message with replacement stats", async () => {
    mockReplacePlaceholders.mockResolvedValue({
      success: true,
      filesModified: 5,
      occurrences: 12,
    });
    const { lastFrame } = render(<BrandStep {...defaultProps} />);
    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Replaced 12 occurrences across 5 files");
    });
  });

  it("calls onComplete after successful replacement", async () => {
    const handleComplete = vi.fn();
    mockReplacePlaceholders.mockResolvedValue({
      success: true,
      filesModified: 5,
      occurrences: 12,
    });
    render(<BrandStep {...defaultProps} onComplete={handleComplete} />);
    await vi.waitFor(() => {
      expect(handleComplete).toHaveBeenCalled();
    });
  });

  it("shows ErrorRecovery on failure", async () => {
    mockReplacePlaceholders.mockResolvedValue({
      success: false,
      filesModified: 0,
      occurrences: 0,
      error: "Permission denied",
    });
    const { lastFrame } = render(<BrandStep {...defaultProps} />);
    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Permission denied");
    });
  });

  it("retries replacement when retry is triggered", async () => {
    // First call fails, second call succeeds
    mockReplacePlaceholders
      .mockResolvedValueOnce({
        success: false,
        filesModified: 0,
        occurrences: 0,
        error: "Temporary failure",
      })
      .mockResolvedValueOnce({
        success: true,
        filesModified: 3,
        occurrences: 7,
      });

    const { lastFrame, stdin } = render(<BrandStep {...defaultProps} />);

    // Wait for error state
    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Temporary failure");
    });

    // Press 'r' to retry
    stdin.write("r");

    // Should resolve successfully on retry
    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Replaced 7 occurrences across 3 files");
    });

    expect(mockReplacePlaceholders).toHaveBeenCalledTimes(2);
  });
});
