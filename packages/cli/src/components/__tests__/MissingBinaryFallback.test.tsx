import { describe, it, expect, vi } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { MissingBinaryFallback } from "../MissingBinaryFallback.js";
import type { CLIAdapter } from "../../lib/adapters/index.js";

function makeAdapter(
  id: "claude" | "codex" | "opencode",
  name: string,
): CLIAdapter {
  return {
    id,
    name,
    binary: id,
    run: () => ({
      result: Promise.resolve({ exitCode: 0, sentinelDetected: false, stderr: "" }),
      kill: () => {},
    }),
  };
}

const claude = makeAdapter("claude", "Claude Code");
const codex = makeAdapter("codex", "Codex");

describe("MissingBinaryFallback", () => {
  it("renders warning with missing CLI name", () => {
    const { lastFrame } = render(
      <MissingBinaryFallback
        missing="codex"
        available={[claude, codex]}
        onSelect={() => {}}
      />,
    );
    expect(lastFrame()).toContain("codex binary not found on PATH");
  });

  it("shows select picker with available CLIs", () => {
    const { lastFrame } = render(
      <MissingBinaryFallback
        missing="codex"
        available={[claude, codex]}
        onSelect={() => {}}
      />,
    );
    expect(lastFrame()).toContain("Choose an available CLI:");
    expect(lastFrame()).toContain("Claude Code (claude)");
    expect(lastFrame()).toContain("Codex (codex)");
  });

  it("calls onSelect with chosen adapter", async () => {
    const onSelect = vi.fn();
    const { stdin } = render(
      <MissingBinaryFallback
        missing="codex"
        available={[claude, codex]}
        onSelect={onSelect}
      />,
    );
    // Allow ink-select-input to mount, then press enter to select first item
    await new Promise((r) => setTimeout(r, 50));
    stdin.write("\r");
    await vi.waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(claude);
    });
  });

  it("shows error when no CLIs available", () => {
    const { lastFrame } = render(
      <MissingBinaryFallback
        missing="codex"
        available={[]}
        onSelect={() => {}}
      />,
    );
    expect(lastFrame()).toContain("codex binary not found on PATH");
    expect(lastFrame()).toContain("No supported CLI is installed");
    expect(lastFrame()).toContain("claude");
    expect(lastFrame()).toContain("codex");
    expect(lastFrame()).toContain("opencode");
  });

  it("does not show select picker when no CLIs available", () => {
    const { lastFrame } = render(
      <MissingBinaryFallback
        missing="codex"
        available={[]}
        onSelect={() => {}}
      />,
    );
    expect(lastFrame()).not.toContain("Choose an available CLI:");
  });
});
