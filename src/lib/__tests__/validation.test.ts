import { describe, it, expect } from "vitest";
import {
  projectNameSchema,
  urlSchema,
  optionalUrlSchema,
  requiredStringSchema,
  validate,
  schemas,
} from "../validation.js";

describe("validation", () => {
  describe("projectNameSchema", () => {
    it("accepts valid kebab-case names", () => {
      expect(projectNameSchema.safeParse("my-project").success).toBe(true);
      expect(projectNameSchema.safeParse("project").success).toBe(true);
      expect(projectNameSchema.safeParse("my-cool-project").success).toBe(true);
      expect(projectNameSchema.safeParse("app1").success).toBe(true);
      expect(projectNameSchema.safeParse("my-project-123").success).toBe(true);
    });

    it("rejects empty strings", () => {
      const result = projectNameSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("rejects names starting with numbers", () => {
      const result = projectNameSchema.safeParse("123-project");
      expect(result.success).toBe(false);
    });

    it("rejects names with uppercase letters", () => {
      const result = projectNameSchema.safeParse("MyProject");
      expect(result.success).toBe(false);
    });

    it("rejects names with underscores", () => {
      const result = projectNameSchema.safeParse("my_project");
      expect(result.success).toBe(false);
    });

    it("rejects names with consecutive hyphens", () => {
      const result = projectNameSchema.safeParse("my--project");
      expect(result.success).toBe(false);
    });

    it("rejects names ending with hyphen", () => {
      const result = projectNameSchema.safeParse("my-project-");
      expect(result.success).toBe(false);
    });

    it("rejects names starting with hyphen", () => {
      const result = projectNameSchema.safeParse("-my-project");
      expect(result.success).toBe(false);
    });

    it("rejects names longer than 64 characters", () => {
      const longName = "a" + "-bcd".repeat(20);
      const result = projectNameSchema.safeParse(longName);
      expect(result.success).toBe(false);
    });

    it("accepts names exactly 64 characters", () => {
      const exactName = "a".repeat(64);
      const result = projectNameSchema.safeParse(exactName);
      expect(result.success).toBe(true);
    });
  });

  describe("urlSchema", () => {
    it("accepts valid https URLs", () => {
      expect(urlSchema.safeParse("https://example.com").success).toBe(true);
      expect(urlSchema.safeParse("https://sub.example.com/path").success).toBe(true);
    });

    it("accepts valid http URLs", () => {
      expect(urlSchema.safeParse("http://localhost:3000").success).toBe(true);
      expect(urlSchema.safeParse("http://example.com").success).toBe(true);
    });

    it("rejects invalid URLs", () => {
      expect(urlSchema.safeParse("not-a-url").success).toBe(false);
      expect(urlSchema.safeParse("").success).toBe(false);
    });

    it("rejects URLs without http/https", () => {
      expect(urlSchema.safeParse("ftp://example.com").success).toBe(false);
    });
  });

  describe("optionalUrlSchema", () => {
    it("accepts empty strings", () => {
      expect(optionalUrlSchema.safeParse("").success).toBe(true);
    });

    it("accepts valid URLs", () => {
      expect(optionalUrlSchema.safeParse("https://example.com").success).toBe(true);
    });

    it("rejects invalid non-empty URLs", () => {
      expect(optionalUrlSchema.safeParse("not-a-url").success).toBe(false);
    });
  });

  describe("requiredStringSchema", () => {
    it("accepts non-empty strings", () => {
      expect(requiredStringSchema.safeParse("hello").success).toBe(true);
      expect(requiredStringSchema.safeParse(" ").success).toBe(true);
    });

    it("rejects empty strings", () => {
      expect(requiredStringSchema.safeParse("").success).toBe(false);
    });
  });

  describe("validate helper", () => {
    it("returns success with data for valid input", () => {
      const result = validate(projectNameSchema, "my-project");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("my-project");
      }
    });

    it("returns error message for invalid input", () => {
      const result = validate(projectNameSchema, "");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Project name is required");
      }
    });

    it("returns fallback error for missing error message", () => {
      const result = validate(requiredStringSchema, "");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("This field is required");
      }
    });
  });

  describe("schemas export", () => {
    it("exports all schemas", () => {
      expect(schemas.projectName).toBe(projectNameSchema);
      expect(schemas.url).toBe(urlSchema);
      expect(schemas.optionalUrl).toBe(optionalUrlSchema);
      expect(schemas.required).toBe(requiredStringSchema);
    });
  });
});
