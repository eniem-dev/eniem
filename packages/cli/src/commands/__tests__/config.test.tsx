import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import React from "react";

vi.mock("ink", async () => {
  const actual = await vi.importActual("ink");
  return {
    ...(actual as object),
    useApp: () => ({ exit: vi.fn() }),
  };
});

vi.mock("../../lib/eni-config.js", () => ({
  readConfig: vi.fn(() => Promise.resolve(null)),
  writeConfig: vi.fn(() => Promise.resolve()),
}));

vi.mock("../../lib/adapters/index.js", () => ({
  SUPPORTED_CLIS: ["claude", "codex", "gemini", "opencode"] as const,
  getAdapter: vi.fn((id: string) => ({
    id,
    name: { claude: "Claude Code", codex: "Codex", gemini: "Gemini CLI", opencode: "OpenCode" }[id],
    binary: id,
    run: () => ({
      result: Promise.resolve({ exitCode: 0, sentinelDetected: false }),
      kill: () => {},
    }),
  })),
  checkBinary: vi.fn(() => Promise.resolve(true)),
}));

import { ConfigCommand } from "../config.js";
import { readConfig, writeConfig } from "../../lib/eni-config.js";
import { checkBinary } from "../../lib/adapters/index.js";

const mockReadConfig = vi.mocked(readConfig);
const mockWriteConfig = vi.mocked(writeConfig);
const mockCheckBinary = vi.mocked(checkBinary);

describe("ConfigCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckBinary.mockResolvedValue(true);
    mockReadConfig.mockResolvedValue(null);
    mockWriteConfig.mockResolvedValue();
  });

  it("renders plan CLI picker", async () => {
    const { lastFrame } = render(<ConfigCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Default CLI for plan:");
    });
    expect(lastFrame()).toContain("Claude Code (claude)");
    expect(lastFrame()).toContain("Codex (codex)");
    expect(lastFrame()).toContain("Gemini CLI (gemini)");
    expect(lastFrame()).toContain("OpenCode (opencode)");
  });

  it("shows current config when one exists", async () => {
    mockReadConfig.mockResolvedValue({ plan: "claude", build: "codex" });

    const { lastFrame } = render(<ConfigCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("plan: claude");
      expect(lastFrame()).toContain("build: codex");
    });
  });

  it("grays out unavailable CLIs with 'not installed' label", async () => {
    mockCheckBinary.mockImplementation(async (name: string) =>
      name !== "gemini",
    );

    const { lastFrame } = render(<ConfigCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Gemini CLI (gemini) — not installed");
    });
    expect(lastFrame()).not.toContain("Claude Code (claude) — not installed");
  });

  it("renders build CLI picker after plan selection", async () => {
    const { lastFrame, stdin } = render(<ConfigCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Default CLI for plan:");
    });

    // Select first option (Claude Code) with Enter
    stdin.write("\r");

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Plan CLI: claude");
      expect(lastFrame()).toContain("Default CLI for build:");
    });
  });

  it("shows summary after both selections", async () => {
    const { lastFrame, stdin } = render(<ConfigCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Default CLI for plan:");
    });

    // Select plan CLI
    stdin.write("\r");

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Default CLI for build:");
    });

    // Small delay so ink-select-input registers the new Select
    await new Promise((r) => setTimeout(r, 50));

    // Select build CLI
    stdin.write("\r");

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Saved to .eni/config.json");
    });
    expect(lastFrame()).toContain("Plan CLI: claude");
    expect(lastFrame()).toContain("Build CLI: claude");
  });

  it("calls writeConfig with selected values", async () => {
    const { lastFrame, stdin } = render(<ConfigCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Default CLI for plan:");
    });

    stdin.write("\r");

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Default CLI for build:");
    });

    // Small delay so ink-select-input registers the new Select
    await new Promise((r) => setTimeout(r, 50));

    stdin.write("\r");

    await vi.waitFor(() => {
      expect(mockWriteConfig).toHaveBeenCalledWith("/tmp", {
        plan: "claude",
        build: "claude",
      });
    });
  });
});
