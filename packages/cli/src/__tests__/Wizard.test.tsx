import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { Wizard } from "../Wizard.js";
import { ConfigProvider } from "../config/ConfigContext.js";

// Mock all steps with simple Text components
vi.mock("../steps/index.js", async () => {
  const { Text } = await import("ink");
  const React = await import("react");

  return {
    ProjectSetup: ({ initialName }: { initialName?: string }) => {
      return React.createElement(Text, null, initialName ? `ProjectSetup done: ${initialName}` : "ProjectSetup active");
    },
    CloneStep: ({ projectName }: { projectName: string }) => {
      return React.createElement(Text, null, `CloneStep: ${projectName}`);
    },
    OAuthSetup: () => React.createElement(Text, null, "OAuthSetup"),
    PaymentSetup: () => React.createElement(Text, null, "PaymentSetup"),
    StorageSetup: () => React.createElement(Text, null, "StorageSetup"),
    AnalyticsSetup: () => React.createElement(Text, null, "AnalyticsSetup"),
    EnvStep: () => React.createElement(Text, null, "EnvStep"),
    GitStep: () => React.createElement(Text, null, "GitStep"),
    InstallStep: () => React.createElement(Text, null, "InstallStep"),
  };
});

// Wrapper to provide config context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <ConfigProvider>{children}</ConfigProvider>;
};

describe("Wizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders ProjectSetup step initially", () => {
    const { lastFrame } = render(
      <TestWrapper>
        <Wizard gitHost="github" onComplete={() => {}} />
      </TestWrapper>
    );
    expect(lastFrame()).toContain("ProjectSetup");
  });

  it("renders with initial project name", () => {
    const { lastFrame } = render(
      <TestWrapper>
        <Wizard initialProjectName="my-app" gitHost="github" onComplete={() => {}} />
      </TestWrapper>
    );
    // Should render ProjectSetup with the initial name passed
    expect(lastFrame()).toContain("my-app");
  });
});
