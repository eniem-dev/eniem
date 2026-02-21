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

vi.mock("../../lib/claude-runner.js", () => ({
  runClaude: vi.fn(),
  checkBinary: vi.fn(),
}));

import { BuildCommand } from "../build.js";
import { listSpecs, moveSpec } from "../../lib/specs.js";
import { loadTemplate, resolveTemplate, buildTemplateVars } from "../../lib/template.js";
import { runClaude, checkBinary } from "../../lib/claude-runner.js";

const mockListSpecs = vi.mocked(listSpecs);
const mockMoveSpec = vi.mocked(moveSpec);
const mockLoadTemplate = vi.mocked(loadTemplate);
const mockResolveTemplate = vi.mocked(resolveTemplate);
const mockBuildTemplateVars = vi.mocked(buildTemplateVars);
const mockRunClaude = vi.mocked(runClaude);
const mockCheckBinary = vi.mocked(checkBinary);

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

      expect(lastFrame()).toContain("Select a spec to build:");
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
      mockRunClaude.mockReturnValue({
        result: new Promise(() => {}), // Never resolves — stays in running state
        kill: vi.fn(),
      });

      const { lastFrame } = render(
        <BuildCommand {...defaultProps} spec="my-feature" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Iteration 1/10");
    });
  });

  describe("Summary", () => {
    it("shows 'spec archived' when sentinel detected", async () => {
      mockListSpecs.mockResolvedValue([
        { name: "test", path: "/project/specs/planned/test.md" },
      ]);
      mockLoadTemplate.mockResolvedValue("template");
      mockResolveTemplate.mockReturnValue("prompt");
      mockRunClaude.mockReturnValue({
        result: Promise.resolve({ exitCode: 0, sentinelDetected: true }),
        kill: vi.fn(),
      });

      const { lastFrame } = render(
        <BuildCommand {...defaultProps} spec="test" />
      );

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(lastFrame()).toContain("Build complete");
      expect(lastFrame()).toContain("spec archived");
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
      mockRunClaude.mockReturnValue({
        result: Promise.resolve({ exitCode: 0, sentinelDetected: false }),
        kill: vi.fn(),
      });

      const { lastFrame } = render(
        <BuildCommand {...defaultProps} spec="test" iterations={2} />
      );

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(lastFrame()).toContain("spec stays in planned");
      expect(mockMoveSpec).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("shows error when prompt file is missing", async () => {
      mockListSpecs.mockResolvedValue([
        { name: "test", path: "/project/specs/planned/test.md" },
      ]);
      mockLoadTemplate.mockRejectedValue(new Error("ENOENT"));

      const { lastFrame } = render(
        <BuildCommand {...defaultProps} spec="test" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Prompt file not found");
    });

    it("shows error when --spec name not found", async () => {
      mockListSpecs.mockResolvedValue([]);

      const { lastFrame } = render(
        <BuildCommand {...defaultProps} spec="nonexistent" />
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(lastFrame()).toContain("Spec not found");
    });
  });
});
