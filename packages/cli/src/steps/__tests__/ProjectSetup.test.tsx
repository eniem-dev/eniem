import { describe, it, expect, vi } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { ProjectSetup } from "../ProjectSetup.js";

describe("ProjectSetup", () => {
  it("renders section header", () => {
    const { lastFrame } = render(
      <ProjectSetup onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Project Configuration");
  });

  it("renders project name input when no initial name", () => {
    const { lastFrame } = render(
      <ProjectSetup onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Project name:");
  });

  it("renders placeholder text", () => {
    const { lastFrame } = render(
      <ProjectSetup onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("my-eniem-app");
  });

  it("calls onComplete immediately with initial name", () => {
    const handleComplete = vi.fn();
    render(<ProjectSetup initialName="my-app" onComplete={handleComplete} />);
    expect(handleComplete).toHaveBeenCalledWith({ name: "my-app" });
  });

  it("shows done state when initial name provided", () => {
    const { lastFrame } = render(
      <ProjectSetup initialName="test-project" onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Name: test-project");
    expect(lastFrame()).toContain("✓");
  });
});
