import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isDeprecatedBinary,
  buildDeprecationBanner,
  printDeprecationNotice,
} from "./deprecation.js";

describe("isDeprecatedBinary", () => {
  it("returns true for eniem-cli", () => {
    expect(isDeprecatedBinary("/usr/local/bin/eniem-cli")).toBe(true);
  });

  it("returns true for eniem (without -cli suffix)", () => {
    expect(isDeprecatedBinary("/usr/local/bin/eniem")).toBe(true);
  });

  it("returns false for eni", () => {
    expect(isDeprecatedBinary("/usr/local/bin/eni")).toBe(false);
  });

  it("returns false for node (direct execution)", () => {
    expect(isDeprecatedBinary("/usr/local/bin/node")).toBe(false);
  });

  it("handles Windows-style paths", () => {
    expect(isDeprecatedBinary("C:\\Users\\dev\\AppData\\eniem-cli")).toBe(true);
  });
});

describe("buildDeprecationBanner", () => {
  it("includes the install command", () => {
    const lines = buildDeprecationBanner("/usr/local/bin/eniem-cli", []);
    const text = lines.join("\n");
    expect(text).toContain("npm install -g eniem");
  });

  it("includes box borders", () => {
    const lines = buildDeprecationBanner("/usr/local/bin/eniem-cli", []);
    expect(lines[0]).toMatch(/^╔═+╗$/);
    expect(lines[lines.length - 1]).toMatch(/^╚═+╝$/);
  });

  it("maps 'ai init' to 'eni ai setup'", () => {
    const lines = buildDeprecationBanner("/usr/local/bin/eniem-cli", [
      "ai",
      "init",
    ]);
    const text = lines.join("\n");
    expect(text).toContain("eni ai setup");
  });

  it("maps 'products' to 'eni products'", () => {
    const lines = buildDeprecationBanner("/usr/local/bin/eniem-cli", [
      "products",
    ]);
    const text = lines.join("\n");
    expect(text).toContain("eni products");
  });

  it("maps project name to 'eni project <name>'", () => {
    const lines = buildDeprecationBanner("/usr/local/bin/eniem-cli", [
      "my-app",
    ]);
    const text = lines.join("\n");
    expect(text).toContain("eni project my-app");
  });

  it("does not add a migration hint for help/version", () => {
    const lines = buildDeprecationBanner("/usr/local/bin/eniem-cli", ["help"]);
    const text = lines.join("\n");
    expect(text).not.toContain("eni project help");
  });
});

describe("printDeprecationNotice", () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it("prints banner when invoked as eniem-cli", () => {
    const printed = printDeprecationNotice("/usr/local/bin/eniem-cli", []);
    expect(printed).toBe(true);
    const output = stderrSpy.mock.calls.map((c: unknown[]) => c[0]).join("\n");
    expect(output).toContain("eniem-cli is deprecated");
    expect(output).toContain("npm install -g eniem");
  });

  it("does NOT print banner when invoked as eni", () => {
    const printed = printDeprecationNotice("/usr/local/bin/eni", []);
    expect(printed).toBe(false);
    // Only empty calls should not contain deprecation text
    const output = stderrSpy.mock.calls.map((c: unknown[]) => c[0]).join("\n");
    expect(output).not.toContain("deprecated");
  });

  it("commands still proceed (does not exit)", () => {
    printDeprecationNotice("/usr/local/bin/eniem-cli", ["my-app"]);
    // If we reach here, process.exit was not called
    expect(true).toBe(true);
  });
});
