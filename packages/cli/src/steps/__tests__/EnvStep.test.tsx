import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { EnvStep } from "../EnvStep.js";
import type { AppConfig } from "../../config/types.js";

// Mock the env lib
vi.mock("../../lib/env.js", () => ({
  writeEnvFile: vi.fn(),
}));

import { writeEnvFile } from "../../lib/env.js";
const mockWriteEnvFile = writeEnvFile as ReturnType<typeof vi.fn>;

describe("EnvStep", () => {
  const mockConfig: AppConfig = {
    project: { name: "test-app" },
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders section header", () => {
    mockWriteEnvFile.mockResolvedValue({
      success: true,
      path: "/path/.env",
    });
    const { lastFrame } = render(
      <EnvStep config={mockConfig} destination="/test" onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Environment Configuration");
  });

  it("shows spinner while generating", () => {
    // Hang forever to keep in generating state
    mockWriteEnvFile.mockImplementation(() => new Promise(() => {}));
    const { lastFrame } = render(
      <EnvStep config={mockConfig} destination="/test" onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Generating .env file...");
  });

  it("calls writeEnvFile", () => {
    mockWriteEnvFile.mockResolvedValue({
      success: true,
      path: "/test/.env",
    });
    render(
      <EnvStep config={mockConfig} destination="/my-project" onComplete={() => {}} />
    );
    expect(mockWriteEnvFile).toHaveBeenCalled();
  });

  it("shows success state after env file is generated", async () => {
    mockWriteEnvFile.mockResolvedValue({
      success: true,
      path: "/test/project/.env",
    });
    const { lastFrame } = render(
      <EnvStep config={mockConfig} destination="/test/project" onComplete={() => {}} />
    );
    await vi.waitFor(() => {
      expect(lastFrame()).toContain(".env file generated");
    });
  });

  it("calls onComplete after env file is generated", async () => {
    const handleComplete = vi.fn();
    mockWriteEnvFile.mockResolvedValue({
      success: true,
      path: "/test/project/.env",
    });
    render(
      <EnvStep config={mockConfig} destination="/test/project" onComplete={handleComplete} />
    );
    await vi.waitFor(() => {
      expect(handleComplete).toHaveBeenCalled();
    });
  });

  it("shows error state when env file generation fails", async () => {
    mockWriteEnvFile.mockResolvedValue({
      success: false,
      error: "Write failed",
    });
    const { lastFrame } = render(
      <EnvStep config={mockConfig} destination="/test" onComplete={() => {}} />
    );
    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Write failed");
    });
  });
});
