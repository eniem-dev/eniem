import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { FirstRunPrompt } from "../FirstRunPrompt.js";
import type { CLIAdapter } from "../../lib/adapters/index.js";

vi.mock("../../lib/eni-config.js", () => ({
  writeConfig: vi.fn(() => Promise.resolve()),
}));

function makeAdapter(
  id: "claude" | "codex" | "gemini" | "opencode",
  name: string,
): CLIAdapter {
  return {
    id,
    name,
    binary: id,
    run: () => ({
      result: Promise.resolve({ exitCode: 0, sentinelDetected: false }),
      kill: () => {},
    }),
  };
}

const claude = makeAdapter("claude", "Claude Code");
const codex = makeAdapter("codex", "Codex");
const gemini = makeAdapter("gemini", "Gemini CLI");

describe("FirstRunPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders header text", () => {
    const { lastFrame } = render(
      <FirstRunPrompt
        available={[claude, codex]}
        cwd="/tmp"
        onComplete={() => {}}
      />,
    );
    expect(lastFrame()).toContain("CLI Configuration");
    expect(lastFrame()).toContain(
      "No CLI configuration found",
    );
  });

  it("shows select picker with available CLIs", () => {
    const { lastFrame } = render(
      <FirstRunPrompt
        available={[claude, codex, gemini]}
        cwd="/tmp"
        onComplete={() => {}}
      />,
    );
    expect(lastFrame()).toContain("Default CLI for plan:");
    expect(lastFrame()).toContain("Claude Code (claude)");
    expect(lastFrame()).toContain("Codex (codex)");
    expect(lastFrame()).toContain("Gemini CLI (gemini)");
  });

  it("auto-selects when only one CLI available", () => {
    const onComplete = vi.fn();
    const { lastFrame } = render(
      <FirstRunPrompt
        available={[claude]}
        cwd="/tmp"
        onComplete={onComplete}
      />,
    );
    expect(lastFrame()).toContain("auto-selecting Claude Code");
    expect(lastFrame()).toContain("Saved to .eni/config.json");
  });

  it("shows error when no CLIs available", () => {
    const { lastFrame } = render(
      <FirstRunPrompt
        available={[]}
        cwd="/tmp"
        onComplete={() => {}}
      />,
    );
    expect(lastFrame()).toContain("No supported CLI found");
    expect(lastFrame()).toContain("claude");
    expect(lastFrame()).toContain("codex");
    expect(lastFrame()).toContain("gemini");
    expect(lastFrame()).toContain("opencode");
  });

  it("renders plan picker first for multiple CLIs", () => {
    const { lastFrame } = render(
      <FirstRunPrompt
        available={[claude, codex]}
        cwd="/tmp"
        onComplete={() => {}}
      />,
    );
    expect(lastFrame()).toContain("Default CLI for plan:");
    expect(lastFrame()).not.toContain("Default CLI for build:");
  });

  it("calls onComplete with config for auto-select", async () => {
    const onComplete = vi.fn();
    render(
      <FirstRunPrompt
        available={[claude]}
        cwd="/tmp"
        onComplete={onComplete}
      />,
    );

    // Wait for async writeConfig to resolve
    await vi.waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith({
        plan: "claude",
        build: "claude",
      });
    });
  });
});
