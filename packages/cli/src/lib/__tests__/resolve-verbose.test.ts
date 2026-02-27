import { describe, it, expect } from "vitest";
import { resolveVerbose } from "../resolve-verbose.js";

describe("resolveVerbose", () => {
  it("returns true when --verbose flag is passed", () => {
    expect(resolveVerbose(true, null)).toBe(true);
    expect(resolveVerbose(true, { verbose: false })).toBe(true);
    expect(resolveVerbose(true, { verbose: true })).toBe(true);
  });

  it("returns false when --no-verbose flag is passed", () => {
    expect(resolveVerbose(false, null)).toBe(false);
    expect(resolveVerbose(false, { verbose: true })).toBe(false);
    expect(resolveVerbose(false, { verbose: false })).toBe(false);
  });

  it("reads config.verbose when no flag is passed", () => {
    expect(resolveVerbose(undefined, { verbose: true })).toBe(true);
    expect(resolveVerbose(undefined, { verbose: false })).toBe(false);
  });

  it("defaults to false when no flag and no config", () => {
    expect(resolveVerbose(undefined, null)).toBe(false);
  });

  it("defaults to false when no flag and config lacks verbose key", () => {
    expect(resolveVerbose(undefined, {})).toBe(false);
    expect(resolveVerbose(undefined, { plan: "claude" })).toBe(false);
  });
});
