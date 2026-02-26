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

import { PlanCommand } from "../plan.js";
import { listSpecs, moveSpec } from "../../lib/specs.js";
import { loadTemplate, resolveTemplate, buildTemplateVars } from "../../lib/template.js";
import { getAdapter, checkBinary } from "../../lib/adapters/index.js";

const mockListSpecs = vi.mocked(listSpecs);
const mockMoveSpec = vi.mocked(moveSpec);
const mockLoadTemplate = vi.mocked(loadTemplate);
const mockResolveTemplate = vi.mocked(resolveTemplate);
const mockBuildTemplateVars = vi.mocked(buildTemplateVars);
const mockGetAdapter = vi.mocked(getAdapter);
const mockCheckBinary = vi.mocked(checkBinary);

const defaultProps = {
  iterations: 3,
  verbose: false,
  specsDir: "/project/specs",
  promptFile: "/project/.eni/PROMPT_plan.md",
};

describe("PlanCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckBinary.mockResolvedValue(true);
    mockGetAdapter.mockReturnValue({ name: "Claude Code", id: "claude", binary: "claude", run: mockRun });
    mockMoveSpec.mockResolvedValue("/project/specs/planned/test.md");
    mockBuildTemplateVars.mockReturnValue({ SPEC_NAME: "test", ITERATION: "1" });
  });

  describe("Spec Selection", () => {
    it("renders spec selection list when specs exist", async () => {
      mockListSpecs.mockResolvedValue([
        { name: "feature-a", path: "/project/specs/feature-a.md" },
        { name: "feature-b", path: "/project/specs/feature-b.md" },
      ]);

      const { lastFrame } = render(<PlanCommand {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(lastFrame()).toContain("Select a spec to plan:");
      expect(lastFrame()).toContain("feature-a");
      expect(lastFrame()).toContain("feature-b");
    });

    it('shows "No unplanned specs found" when folder empty', async () => {
      mockListSpecs.mockResolvedValue([]);

      const { lastFrame } = render(<PlanCommand {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(lastFrame()).toContain("No unplanned specs found");
    });
  });

  describe("Direct --spec flag", () => {
    it("shows error when --spec name not found", async () => {
      mockListSpecs.mockResolvedValue([]);

      const { lastFrame } = render(
        <PlanCommand {...defaultProps} spec="nonexistent" />
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(lastFrame()).toContain("Spec not found");
    });

    it("shows spinner during loop execution when --spec provided", async () => {
      mockListSpecs.mockResolvedValue([
        { name: "my-feature", path: "/project/specs/my-feature.md" },
      ]);
      mockLoadTemplate.mockResolvedValue("template {{SPEC_NAME}}");
      mockResolveTemplate.mockReturnValue("resolved prompt");
      mockRun.mockReturnValue({
        result: new Promise(() => {}), // Never resolves — stays in running state
        kill: vi.fn(),
      });

      const { lastFrame } = render(
        <PlanCommand {...defaultProps} spec="my-feature" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Iteration 1/3");
    });
  });

  describe("Error Handling", () => {
    it("shows error when prompt file is missing", async () => {
      mockListSpecs.mockResolvedValue([
        { name: "test", path: "/project/specs/test.md" },
      ]);
      mockLoadTemplate.mockRejectedValue(new Error("ENOENT"));

      const { lastFrame } = render(
        <PlanCommand {...defaultProps} spec="test" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Prompt file not found");
    });
  });

  describe("Summary", () => {
    it("shows completion summary after successful loop", async () => {
      mockListSpecs.mockResolvedValue([
        { name: "test", path: "/project/specs/test.md" },
      ]);
      mockLoadTemplate.mockResolvedValue("template");
      mockResolveTemplate.mockReturnValue("prompt");
      mockRun.mockReturnValue({
        result: Promise.resolve({ exitCode: 0, sentinelDetected: true }),
        kill: vi.fn(),
      });

      const { lastFrame } = render(
        <PlanCommand {...defaultProps} spec="test" iterations={3} />
      );

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(lastFrame()).toContain("Plan complete");
      expect(lastFrame()).toContain("spec moved to planned");
      expect(mockMoveSpec).toHaveBeenCalled();
    });
  });
});
