import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { WizardProgress } from "../WizardProgress.js";
import type { AppConfig } from "../../config/types.js";

describe("WizardProgress", () => {
  it("returns null when config is empty", () => {
    const config: AppConfig = {};
    const { lastFrame } = render(<WizardProgress config={config} />);
    expect(lastFrame()).toBe("");
  });

  it("shows project name when set", () => {
    const config: AppConfig = { project: { name: "my-app" } };
    const { lastFrame } = render(<WizardProgress config={config} />);
    expect(lastFrame()).toContain("Project: my-app");
  });

  it("shows configuration header", () => {
    const config: AppConfig = { project: { name: "my-app" } };
    const { lastFrame } = render(<WizardProgress config={config} />);
    expect(lastFrame()).toContain("Configuration");
  });

  it("shows enabled features", () => {
    const config: AppConfig = {
      project: { name: "my-app" },
      oauth: {
        github: { clientId: "id", clientSecret: "secret" },
      },
      payment: { enabled: true },
      storage: { enabled: true },
    };
    const { lastFrame } = render(<WizardProgress config={config} />);
    expect(lastFrame()).toContain("GitHub");
    expect(lastFrame()).toContain("Payment");
    expect(lastFrame()).toContain("Storage");
  });

  it("shows Twitter when configured", () => {
    const config: AppConfig = {
      project: { name: "my-app" },
      oauth: {
        twitter: { clientId: "id", clientSecret: "secret" },
      },
    };
    const { lastFrame } = render(<WizardProgress config={config} />);
    expect(lastFrame()).toContain("Twitter");
  });

  it("shows Web3 when enabled", () => {
    const config: AppConfig = {
      project: { name: "my-app" },
      web3: { enabled: true },
    };
    const { lastFrame } = render(<WizardProgress config={config} />);
    expect(lastFrame()).toContain("Web3");
  });

  it("shows analytics provider when enabled", () => {
    const config: AppConfig = {
      project: { name: "my-app" },
      analytics: { enabled: true, provider: "posthog" },
    };
    const { lastFrame } = render(<WizardProgress config={config} />);
    expect(lastFrame()).toContain("Analytics (posthog)");
  });

  it("does not show analytics when provider is none", () => {
    const config: AppConfig = {
      project: { name: "my-app" },
      analytics: { enabled: true, provider: "none" },
    };
    const { lastFrame } = render(<WizardProgress config={config} />);
    expect(lastFrame()).not.toContain("Analytics");
  });

  it("does not show features line when no features enabled", () => {
    const config: AppConfig = { project: { name: "my-app" } };
    const { lastFrame } = render(<WizardProgress config={config} />);
    expect(lastFrame()).not.toContain("Features:");
  });
});
