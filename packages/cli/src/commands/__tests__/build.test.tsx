import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import React from "react";

// Mock useApp to prevent exit() from unmounting the component in tests
vi.mock("ink", async () => {
  const actual = await vi.importActual("ink");
  return {
    ...(actual as object),
    useApp: () => ({ exit: vi.fn() }),
  };
});

vi.mock("../../lib/specs.js", () => ({
  listSpecs: vi.fn(),
  moveSpec: vi.fn(),
}));

vi.mock("../../lib/template.js", () => ({
  loadTemplate: vi.fn(),
  resolveTemplate: vi.fn(),
  buildTemplateVars: vi.fn(),
}));

const mockRun = vi.fn();

vi.mock("../../lib/adapters/index.js", () => ({
  getAdapter: vi.fn(() => ({ run: mockRun })),
  checkBinary: vi.fn(),
}));

vi.mock("../../lib/resolve-cli.js", () => ({
  resolveCLI: vi.fn(),
}));

vi.mock("../../lib/narration.js", () => ({
  injectNarration: vi.fn((prompt: string) => prompt),
}));

import { BuildCommand } from "../build.js";
import { listSpecs, moveSpec } from "../../lib/specs.js";
import { loadTemplate, resolveTemplate, buildTemplateVars } from "../../lib/template.js";
import { checkBinary } from "../../lib/adapters/index.js";
import { resolveCLI } from "../../lib/resolve-cli.js";
import { injectNarration } from "../../lib/narration.js";

const mockListSpecs = vi.mocked(listSpecs);
const mockMoveSpec = vi.mocked(moveSpec);
const mockLoadTemplate = vi.mocked(loadTemplate);
const mockResolveTemplate = vi.mocked(resolveTemplate);
const mockBuildTemplateVars = vi.mocked(buildTemplateVars);
const mockCheckBinary = vi.mocked(checkBinary);
const mockResolveCLI = vi.mocked(resolveCLI);
const mockInjectNarration = vi.mocked(injectNarration);

const claudeAdapter = { name: "Claude Code", id: "claude" as const, binary: "claude", run: mockRun };

const defaultProps = {
  iterations: 10,
  verbose: false,
  specsDir: "/project/specs/planned",
  promptFile: "/project/.eni/PROMPT_build.md",
};

describe("BuildCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckBinary.mockResolvedValue(true);
    mockResolveCLI.mockResolvedValue({ resolved: true, adapter: claudeAdapter, source: "config" });
    mockMoveSpec.mockResolvedValue("/project/specs/archive/test.md");
    mockBuildTemplateVars.mockReturnValue({ SPEC_NAME: "test", ITERATION: "1" });
  });

  describe("Spec Selection", () => {
    it("renders spec selection from planned dir", async () => {
      mockListSpecs.mockResolvedValue([
        { name: "feature-a", path: "/project/specs/planned/feature-a.md" },
        { name: "feature-b", path: "/project/specs/planned/feature-b.md" },
      ]);

      const { lastFrame } = render(<BuildCommand {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(lastFrame()).toContain("Select specs to build:");
      expect(lastFrame()).toContain("feature-a");
      expect(lastFrame()).toContain("feature-b");
    });

    it("shows 'no planned specs' when planned dir empty", async () => {
      mockListSpecs.mockResolvedValue([]);

      const { lastFrame } = render(<BuildCommand {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(lastFrame()).toContain("No planned specs found");
      expect(lastFrame()).toContain("Run eni plan first");
    });
  });

  describe("Running", () => {
    it("displays spinner during loop", async () => {
      mockListSpecs.mockResolvedValue([
        { name: "my-feature", path: "/project/specs/planned/my-feature.md" },
      ]);
      mockLoadTemplate.mockResolvedValue("template {{SPEC_NAME}}");
      mockResolveTemplate.mockReturnValue("resolved prompt");
      mockRun.mockReturnValue({
        result: new Promise(() => {}), // Never resolves — stays in running state
        kill: vi.fn(),
      });

      const { lastFrame } = render(
        <BuildCommand {...defaultProps} specs={["my-feature"]} />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Iteration 1/10");
    });
  });

  describe("CLI Resolution", () => {
    it("renders FirstRunPrompt when no config exists", async () => {
      const codexAdapter = { name: "Codex", id: "codex" as const, binary: "codex", run: mockRun };
      mockResolveCLI.mockResolvedValue({ needsFirstRun: true, available: [claudeAdapter, codexAdapter] });

      const { lastFrame } = render(
        <BuildCommand {...defaultProps} specs={["test"]} />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("CLI Configuration");
    });

    it("renders MissingBinaryFallback when binary not found", async () => {
      mockResolveCLI.mockResolvedValue({ needsFallback: true, configured: "codex", available: [claudeAdapter] });

      const { lastFrame } = render(
        <BuildCommand {...defaultProps} specs={["test"]} />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("codex binary not found");
    });

    it("shows error when no CLIs are available", async () => {
      mockResolveCLI.mockResolvedValue({ noClisAvailable: true });

      const { lastFrame } = render(
        <BuildCommand {...defaultProps} specs={["test"]} />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("No supported CLI is installed");
    });

    it("shows CLI indicator with adapter name", async () => {
      mockListSpecs.mockResolvedValue([
        { name: "my-feature", path: "/project/specs/planned/my-feature.md" },
      ]);
      mockLoadTemplate.mockResolvedValue("template");
      mockResolveTemplate.mockReturnValue("prompt");
      mockRun.mockReturnValue({
        result: new Promise(() => {}),
        kill: vi.fn(),
      });

      const { lastFrame } = render(
        <BuildCommand {...defaultProps} specs={["my-feature"]} />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Using claude for build");
    });

    it("shows --cli override indicator when flag used", async () => {
      mockResolveCLI.mockResolvedValue({ resolved: true, adapter: claudeAdapter, source: "flag" });
      mockListSpecs.mockResolvedValue([
        { name: "my-feature", path: "/project/specs/planned/my-feature.md" },
      ]);
      mockLoadTemplate.mockResolvedValue("template");
      mockResolveTemplate.mockReturnValue("prompt");
      mockRun.mockReturnValue({
        result: new Promise(() => {}),
        kill: vi.fn(),
      });

      const { lastFrame } = render(
        <BuildCommand {...defaultProps} specs={["my-feature"]} cli="claude" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Using claude for build (--cli override)");
    });

    it("error messages say CLI not Claude", async () => {
      mockListSpecs.mockResolvedValue([
        { name: "test", path: "/project/specs/planned/test.md" },
      ]);
      mockLoadTemplate.mockResolvedValue("template");
      mockResolveTemplate.mockReturnValue("prompt");
      mockRun.mockReturnValue({
        result: Promise.resolve({ exitCode: 1, sentinelDetected: false, stderr: "something went wrong" }),
        kill: vi.fn(),
      });

      const { lastFrame } = render(
        <BuildCommand {...defaultProps} specs={["test"]} />
      );

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(lastFrame()).toContain("CLI exited with code 1");
      expect(lastFrame()).toContain("something went wrong");
      expect(lastFrame()).not.toContain("Claude exited");
    });
  });

  describe("Summary", () => {
    it("shows 'spec archived' when sentinel detected", async () => {
      mockListSpecs.mockResolvedValue([
        { name: "test", path: "/project/specs/planned/test.md" },
      ]);
      mockLoadTemplate.mockResolvedValue("template");
      mockResolveTemplate.mockReturnValue("prompt");
      mockRun.mockReturnValue({
        result: Promise.resolve({ exitCode: 0, sentinelDetected: true, stderr: "" }),
        kill: vi.fn(),
      });

      const { lastFrame } = render(
        <BuildCommand {...defaultProps} specs={["test"]} />
      );

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(lastFrame()).toContain("Build complete");
      expect(lastFrame()).toContain("archived");
      expect(mockMoveSpec).toHaveBeenCalledWith(
        "/project/specs/planned/test.md",
        "/project/specs/archive",
      );
    });

    it("keeps spec in planned when max iterations exhausted without sentinel", async () => {
      mockListSpecs.mockResolvedValue([
        { name: "test", path: "/project/specs/planned/test.md" },
      ]);
      mockLoadTemplate.mockResolvedValue("template");
      mockResolveTemplate.mockReturnValue("prompt");
      mockRun.mockReturnValue({
        result: Promise.resolve({ exitCode: 0, sentinelDetected: false, stderr: "" }),
        kill: vi.fn(),
      });

      const { lastFrame } = render(
        <BuildCommand {...defaultProps} specs={["test"]} iterations={2} />
      );

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(lastFrame()).toContain("stays in planned");
      expect(mockMoveSpec).not.toHaveBeenCalled();
    });
  });

  describe("Narration", () => {
    it("calls injectNarration with narration prop before running adapter", async () => {
      mockListSpecs.mockResolvedValue([
        { name: "test", path: "/project/specs/planned/test.md" },
      ]);
      mockLoadTemplate.mockResolvedValue("template");
      mockResolveTemplate.mockReturnValue("resolved prompt");
      mockRun.mockReturnValue({
        result: Promise.resolve({ exitCode: 0, sentinelDetected: true, stderr: "" }),
        kill: vi.fn(),
      });

      render(
        <BuildCommand {...defaultProps} specs={["test"]} narration="explicit" />
      );

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(mockInjectNarration).toHaveBeenCalledWith("resolved prompt", "explicit");
    });

    it("calls injectNarration with undefined when narration prop is omitted", async () => {
      mockListSpecs.mockResolvedValue([
        { name: "test", path: "/project/specs/planned/test.md" },
      ]);
      mockLoadTemplate.mockResolvedValue("template");
      mockResolveTemplate.mockReturnValue("resolved prompt");
      mockRun.mockReturnValue({
        result: Promise.resolve({ exitCode: 0, sentinelDetected: true, stderr: "" }),
        kill: vi.fn(),
      });

      render(
        <BuildCommand {...defaultProps} specs={["test"]} />
      );

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(mockInjectNarration).toHaveBeenCalledWith("resolved prompt", undefined);
    });
  });

  describe("Error Handling", () => {
    it("shows error when prompt file is missing", async () => {
      mockListSpecs.mockResolvedValue([
        { name: "test", path: "/project/specs/planned/test.md" },
      ]);
      mockLoadTemplate.mockRejectedValue(new Error("ENOENT"));

      const { lastFrame } = render(
        <BuildCommand {...defaultProps} specs={["test"]} />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Prompt file not found");
    });

    it("shows error when --spec name not found", async () => {
      mockListSpecs.mockResolvedValue([]);

      const { lastFrame } = render(
        <BuildCommand {...defaultProps} specs={["nonexistent"]} />
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(lastFrame()).toContain("Spec not found");
    });
  });
});
