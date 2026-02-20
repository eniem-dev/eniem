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

  it("shows app name prompt after project name step when initialName provided", () => {
    const { lastFrame } = render(
      <ProjectSetup initialName="my-app" onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("App name:");
  });

  it("shows derived default as pre-filled value", () => {
    const { lastFrame } = render(
      <ProjectSetup initialName="project-zero" onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Project Zero");
  });

  it("calls onComplete immediately when both initialName and initialAppName provided", () => {
    const handleComplete = vi.fn();
    render(<ProjectSetup initialName="my-app" initialAppName="My App" onComplete={handleComplete} />);
    expect(handleComplete).toHaveBeenCalledWith({ name: "my-app", appName: "My App" });
  });

  it("shows done state when both initial values provided", () => {
    const { lastFrame } = render(
      <ProjectSetup initialName="test-project" initialAppName="Test Project" onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Name: test-project");
    expect(lastFrame()).toContain("App name: Test Project");
  });

  it("skips app name prompt when initialAppName provided with initialName", () => {
    const { lastFrame } = render(
      <ProjectSetup initialName="my-app" initialAppName="My App" onComplete={() => {}} />
    );
    // Should be in done state showing both confirmed values
    expect(lastFrame()).toContain("Name: my-app");
    expect(lastFrame()).toContain("App name: My App");
  });

  it("renders name prompt when initialAppName provided without initialName", () => {
    const { lastFrame } = render(
      <ProjectSetup initialAppName="My App" onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Project name:");
  });

  it("does not show app name input during name step", () => {
    const { lastFrame } = render(
      <ProjectSetup onComplete={() => {}} />
    );
    expect(lastFrame()).not.toContain("App name:");
  });

  it("shows confirmed name above app name input", () => {
    const { lastFrame } = render(
      <ProjectSetup initialName="my-app" onComplete={() => {}} />
    );
    // Should show both the confirmed name and the app name input
    expect(lastFrame()).toContain("Name: my-app");
    expect(lastFrame()).toContain("App name:");
  });
});
