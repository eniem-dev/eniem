import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadTemplate, resolveTemplate, buildTemplateVars, generateSessionId, buildSessionTemplateVars } from "../template.js";
import * as fs from "fs/promises";

vi.mock("fs/promises");

describe("template", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("loadTemplate", () => {
    it("reads file and returns content", async () => {
      vi.mocked(fs.readFile).mockResolvedValue("Hello {{NAME}}");

      const result = await loadTemplate("/project/.eni/PROMPT_plan.md");

      expect(fs.readFile).toHaveBeenCalledWith(
        "/project/.eni/PROMPT_plan.md",
        "utf-8",
      );
      expect(result).toBe("Hello {{NAME}}");
    });

    it("throws if file doesn't exist", async () => {
      vi.mocked(fs.readFile).mockRejectedValue(
        new Error("ENOENT: no such file or directory"),
      );

      await expect(
        loadTemplate("/project/.eni/missing.md"),
      ).rejects.toThrow("ENOENT");
    });
  });

  describe("resolveTemplate", () => {
    it("replaces known placeholders", () => {
      const template = "Branch: {{BRANCH}}, Spec: {{SPEC_NAME}}";
      const vars = { BRANCH: "feat/my-feature", SPEC_NAME: "my-feature" };

      expect(resolveTemplate(template, vars)).toBe(
        "Branch: feat/my-feature, Spec: my-feature",
      );
    });

    it("leaves unknown placeholders unchanged", () => {
      const template = "Known: {{KNOWN}}, Unknown: {{UNKNOWN}}";
      const vars = { KNOWN: "value" };

      expect(resolveTemplate(template, vars)).toBe(
        "Known: value, Unknown: {{UNKNOWN}}",
      );
    });

    it("replaces multiple occurrences of the same placeholder", () => {
      const template = "{{NAME}} and {{NAME}} again";
      const vars = { NAME: "test" };

      expect(resolveTemplate(template, vars)).toBe("test and test again");
    });

    it("handles template with no placeholders", () => {
      expect(resolveTemplate("no placeholders here", {})).toBe(
        "no placeholders here",
      );
    });

    it("handles empty template", () => {
      expect(resolveTemplate("", { KEY: "val" })).toBe("");
    });
  });

  describe("buildTemplateVars", () => {
    it("computes all placeholders correctly", () => {
      const vars = buildTemplateVars("my-feature", 1, "plan");

      expect(vars).toEqual({
        SPEC_NAME: "my-feature",
        ITERATION: "1",
        EPIC_NAME: "my-feature",
        BRANCH: "feat/my-feature",
        WORKTREE: ".worktrees/feat/my-feature",
      });
    });

    it("converts iteration number to string", () => {
      const vars = buildTemplateVars("test", 5, "build");

      expect(vars.ITERATION).toBe("5");
    });

    it("sets EPIC_NAME equal to SPEC_NAME", () => {
      const vars = buildTemplateVars("cool-spec", 1, "plan");

      expect(vars.EPIC_NAME).toBe(vars.SPEC_NAME);
      expect(vars.EPIC_NAME).toBe("cool-spec");
    });

    it("derives BRANCH and WORKTREE from spec name", () => {
      const vars = buildTemplateVars("auth-flow", 2, "build");

      expect(vars.BRANCH).toBe("feat/auth-flow");
      expect(vars.WORKTREE).toBe(".worktrees/feat/auth-flow");
    });
  });

  describe("generateSessionId", () => {
    it("returns YYYYMMDD-HHmm format", () => {
      const id = generateSessionId();

      expect(id).toMatch(/^\d{8}-\d{4}$/);
    });

    it("uses current date/time values", () => {
      const now = new Date();
      const id = generateSessionId();
      const year = String(now.getFullYear());

      expect(id.startsWith(year)).toBe(true);
    });
  });

  describe("buildSessionTemplateVars", () => {
    it("sets IS_LAST_SPEC to true for last spec", () => {
      const vars = buildSessionTemplateVars(
        "07-public-view",
        1,
        "feat/build-session-20260314-1430",
        ".worktrees/feat/build-session-20260314-1430",
        true,
      );

      expect(vars.IS_LAST_SPEC).toBe("true");
    });

    it("sets IS_LAST_SPEC to false for non-last spec", () => {
      const vars = buildSessionTemplateVars(
        "01-infra",
        1,
        "feat/build-session-20260314-1430",
        ".worktrees/feat/build-session-20260314-1430",
        false,
      );

      expect(vars.IS_LAST_SPEC).toBe("false");
    });

    it("sets IS_EPIC to true", () => {
      const vars = buildSessionTemplateVars(
        "test",
        1,
        "feat/build-session-20260314-1430",
        ".worktrees/feat/build-session-20260314-1430",
        false,
      );

      expect(vars.IS_EPIC).toBe("true");
    });

    it("uses session-level BRANCH and WORKTREE, not per-spec", () => {
      const vars = buildSessionTemplateVars(
        "02-board",
        3,
        "feat/build-session-20260314-1430",
        ".worktrees/feat/build-session-20260314-1430",
        false,
      );

      expect(vars.BRANCH).toBe("feat/build-session-20260314-1430");
      expect(vars.WORKTREE).toBe(".worktrees/feat/build-session-20260314-1430");
      expect(vars.SPEC_NAME).toBe("02-board");
      expect(vars.EPIC_NAME).toBe("02-board");
      expect(vars.ITERATION).toBe("3");
    });
  });
});
