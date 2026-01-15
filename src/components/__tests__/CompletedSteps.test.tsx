import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { CompletedSteps } from "../CompletedSteps.js";
import type { AppConfig } from "../../config/types.js";

describe("CompletedSteps", () => {
  it("returns null when currentStep is project", () => {
    const config: AppConfig = { project: { name: "test-project" } };
    const { lastFrame } = render(
      <CompletedSteps config={config} currentStep="project" />
    );
    expect(lastFrame()).toBe("");
  });

  it("shows project name after project step", () => {
    const config: AppConfig = { project: { name: "my-app" } };
    const { lastFrame } = render(
      <CompletedSteps config={config} currentStep="oauth" />
    );
    expect(lastFrame()).toContain("Project: my-app");
    expect(lastFrame()).toContain("Cloned to: my-app/");
  });

  it("shows OAuth status after oauth step", () => {
    const config: AppConfig = {
      project: { name: "my-app" },
      oauth: {
        github: { clientId: "id", clientSecret: "secret" },
      },
      web3: { enabled: false },
    };
    const { lastFrame } = render(
      <CompletedSteps config={config} currentStep="payment" />
    );
    expect(lastFrame()).toContain("GitHub OAuth: Configured");
    expect(lastFrame()).toContain("Twitter OAuth: Skipped");
    expect(lastFrame()).toContain("Web3 (WalletConnect): Skipped");
  });

  it("shows all OAuth providers as configured when set", () => {
    const config: AppConfig = {
      project: { name: "my-app" },
      oauth: {
        github: { clientId: "id", clientSecret: "secret" },
        twitter: { clientId: "id", clientSecret: "secret" },
      },
      web3: { enabled: true, walletConnectProjectId: "proj-id" },
    };
    const { lastFrame } = render(
      <CompletedSteps config={config} currentStep="payment" />
    );
    expect(lastFrame()).toContain("GitHub OAuth: Configured");
    expect(lastFrame()).toContain("Twitter OAuth: Configured");
    expect(lastFrame()).toContain("Web3 (WalletConnect): Configured");
  });

  it("shows payment status after payment step", () => {
    const config: AppConfig = {
      project: { name: "my-app" },
      payment: { enabled: true, accessToken: "token" },
    };
    const { lastFrame } = render(
      <CompletedSteps config={config} currentStep="storage" />
    );
    expect(lastFrame()).toContain("Payment (Polar): Configured");
  });

  it("shows payment skipped when disabled", () => {
    const config: AppConfig = {
      project: { name: "my-app" },
      payment: { enabled: false },
    };
    const { lastFrame } = render(
      <CompletedSteps config={config} currentStep="storage" />
    );
    expect(lastFrame()).toContain("Payment (Polar): Skipped");
  });

  it("shows storage status after storage step", () => {
    const config: AppConfig = {
      project: { name: "my-app" },
      storage: { enabled: true, bucket: "bucket" },
    };
    const { lastFrame } = render(
      <CompletedSteps config={config} currentStep="analytics" />
    );
    expect(lastFrame()).toContain("Storage (DO Spaces): Configured");
  });

  it("shows analytics status after analytics step", () => {
    const config: AppConfig = {
      project: { name: "my-app" },
      analytics: { enabled: true, provider: "umami" },
    };
    const { lastFrame } = render(
      <CompletedSteps config={config} currentStep="env" />
    );
    expect(lastFrame()).toContain("Analytics: umami");
  });

  it("shows analytics skipped when disabled", () => {
    const config: AppConfig = {
      project: { name: "my-app" },
      analytics: { enabled: false },
    };
    const { lastFrame } = render(
      <CompletedSteps config={config} currentStep="env" />
    );
    expect(lastFrame()).toContain("Analytics: Skipped");
  });
});
