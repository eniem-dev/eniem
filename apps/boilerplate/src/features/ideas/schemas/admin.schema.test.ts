import { describe, expect, it } from "vitest";
import { updateIdeaStatusSchema, setAdminResponseSchema } from "./admin.schema";

const validCuid = "clh3av0e00000ml08n8lz6t5r0";

describe("updateIdeaStatusSchema", () => {
  it("accepts valid status change to PLANNED", () => {
    const result = updateIdeaStatusSchema.safeParse({
      ideaId: validCuid,
      status: "PLANNED",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid status change to DONE", () => {
    const result = updateIdeaStatusSchema.safeParse({
      ideaId: validCuid,
      status: "DONE",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid status change to OPEN", () => {
    const result = updateIdeaStatusSchema.safeParse({
      ideaId: validCuid,
      status: "OPEN",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status value", () => {
    const result = updateIdeaStatusSchema.safeParse({
      ideaId: validCuid,
      status: "REJECTED",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid ideaId", () => {
    const result = updateIdeaStatusSchema.safeParse({
      ideaId: "not-a-cuid",
      status: "PLANNED",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing status", () => {
    const result = updateIdeaStatusSchema.safeParse({
      ideaId: validCuid,
    });
    expect(result.success).toBe(false);
  });
});

describe("setAdminResponseSchema", () => {
  it("accepts valid response text", () => {
    const result = setAdminResponseSchema.safeParse({
      ideaId: validCuid,
      response: "Thanks for the feedback!",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null response to remove it", () => {
    const result = setAdminResponseSchema.safeParse({
      ideaId: validCuid,
      response: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects response over 2000 characters", () => {
    const result = setAdminResponseSchema.safeParse({
      ideaId: validCuid,
      response: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid ideaId", () => {
    const result = setAdminResponseSchema.safeParse({
      ideaId: "invalid",
      response: "Some response",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing response field", () => {
    const result = setAdminResponseSchema.safeParse({
      ideaId: validCuid,
    });
    expect(result.success).toBe(false);
  });
});
