import { describe, it, expect } from "vitest";
import { toTitleCase } from "../string.js";

describe("toTitleCase", () => {
  it("converts hyphenated string to title case", () => {
    expect(toTitleCase("project-zero")).toBe("Project Zero");
  });

  it("converts underscored string to title case", () => {
    expect(toTitleCase("my_cool_app")).toBe("My Cool App");
  });

  it("capitalizes a single word", () => {
    expect(toTitleCase("dashboard")).toBe("Dashboard");
  });

  it("handles multiple hyphens", () => {
    expect(toTitleCase("my-super-cool-app")).toBe("My Super Cool App");
  });

  it("lowercases already-capitalized words", () => {
    expect(toTitleCase("MY-APP")).toBe("My App");
  });

  it("handles mixed separators", () => {
    expect(toTitleCase("my-cool_app")).toBe("My Cool App");
  });

  it("capitalizes a single character", () => {
    expect(toTitleCase("a")).toBe("A");
  });
});
