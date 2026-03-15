import { describe, expect, it } from "vitest";
import { toggleVoteSchema } from "./vote.schema";

const validCuid = "clh3av0e00000ml08n8lz6t5r0";

describe("toggleVoteSchema", () => {
  it("accepts a valid cuid ideaId", () => {
    const result = toggleVoteSchema.safeParse({ ideaId: validCuid });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid ideaId", () => {
    const result = toggleVoteSchema.safeParse({ ideaId: "not-a-cuid" });
    expect(result.success).toBe(false);
  });

  it("rejects missing ideaId", () => {
    const result = toggleVoteSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty ideaId", () => {
    const result = toggleVoteSchema.safeParse({ ideaId: "" });
    expect(result.success).toBe(false);
  });
});
