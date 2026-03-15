import { describe, expect, it } from "vitest";
import {
  createIdeaSchema,
  updateIdeaSchema,
  deleteIdeaSchema,
} from "./idea.schema";

const validCuid = "clh3av0e00000ml08n8lz6t5r0";

describe("createIdeaSchema", () => {
  it("accepts valid input with title and description", () => {
    const result = createIdeaSchema.safeParse({
      boardId: validCuid,
      title: "My Idea",
      description: "A detailed description",
    });
    expect(result.success).toBe(true);
  });

  it("accepts input without description", () => {
    const result = createIdeaSchema.safeParse({
      boardId: validCuid,
      title: "My Idea",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createIdeaSchema.safeParse({
      boardId: validCuid,
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 characters", () => {
    const result = createIdeaSchema.safeParse({
      boardId: validCuid,
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects description over 2000 characters", () => {
    const result = createIdeaSchema.safeParse({
      boardId: validCuid,
      title: "My Idea",
      description: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid boardId", () => {
    const result = createIdeaSchema.safeParse({
      boardId: "not-a-cuid",
      title: "My Idea",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing boardId", () => {
    const result = createIdeaSchema.safeParse({
      title: "My Idea",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateIdeaSchema", () => {
  it("accepts valid update with title only", () => {
    const result = updateIdeaSchema.safeParse({
      ideaId: validCuid,
      title: "Updated Title",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid update with description only", () => {
    const result = updateIdeaSchema.safeParse({
      ideaId: validCuid,
      description: "Updated description",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid update with both fields", () => {
    const result = updateIdeaSchema.safeParse({
      ideaId: validCuid,
      title: "Updated Title",
      description: "Updated description",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid ideaId", () => {
    const result = updateIdeaSchema.safeParse({
      ideaId: "not-a-cuid",
      title: "Updated",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty ideaId", () => {
    const result = updateIdeaSchema.safeParse({
      ideaId: "",
      title: "Updated",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 characters", () => {
    const result = updateIdeaSchema.safeParse({
      ideaId: validCuid,
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });
});

describe("deleteIdeaSchema", () => {
  it("accepts valid cuid ideaId", () => {
    const result = deleteIdeaSchema.safeParse({
      ideaId: validCuid,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid ideaId", () => {
    const result = deleteIdeaSchema.safeParse({
      ideaId: "invalid",
    });
    expect(result.success).toBe(false);
  });
});
