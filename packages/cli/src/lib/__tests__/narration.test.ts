import { describe, it, expect } from "vitest";
import { injectNarration } from "../narration.js";

const PROMPT = "# Build Mode\n\nYou are in BUILD mode.";

describe("injectNarration", () => {
  it("prepends Communication Style section when narration is explicit", () => {
    const result = injectNarration(PROMPT, "explicit");
    expect(result.startsWith("## Communication Style\n\n")).toBe(true);
    expect(result).toContain(
      "Always explain what you are about to do before using any tool, and briefly summarize what you found or accomplished after. Keep narration concise — 1-2 sentences.",
    );
    expect(result.endsWith(PROMPT)).toBe(true);
  });

  it("returns prompt unchanged when narration is concise", () => {
    expect(injectNarration(PROMPT, "concise")).toBe(PROMPT);
  });

  it("returns prompt unchanged when narration is undefined", () => {
    expect(injectNarration(PROMPT, undefined)).toBe(PROMPT);
  });
});
