import { describe, expect, it } from "vitest";
import {
  createBoardSchema,
  updateBoardSchema,
  deleteBoardSchema,
  restoreBoardSchema,
} from "./board.schema";

describe("createBoardSchema", () => {
  it("accepts valid input", () => {
    const result = createBoardSchema.safeParse({
      name: "My Board",
      slug: "my-board",
      description: "A feedback board",
    });
    expect(result.success).toBe(true);
  });

  it("accepts input without description", () => {
    const result = createBoardSchema.safeParse({
      name: "My Board",
      slug: "my-board",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createBoardSchema.safeParse({
      name: "",
      slug: "my-board",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 characters", () => {
    const result = createBoardSchema.safeParse({
      name: "a".repeat(101),
      slug: "my-board",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug shorter than 3 characters", () => {
    const result = createBoardSchema.safeParse({
      name: "Board",
      slug: "ab",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug over 50 characters", () => {
    const result = createBoardSchema.safeParse({
      name: "Board",
      slug: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("rejects uppercase slug", () => {
    const result = createBoardSchema.safeParse({
      name: "Board",
      slug: "My-Board",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug with special characters", () => {
    const result = createBoardSchema.safeParse({
      name: "Board",
      slug: "my_board!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug starting with hyphen", () => {
    const result = createBoardSchema.safeParse({
      name: "Board",
      slug: "-my-board",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug ending with hyphen", () => {
    const result = createBoardSchema.safeParse({
      name: "Board",
      slug: "my-board-",
    });
    expect(result.success).toBe(false);
  });

  it("accepts slug with numbers", () => {
    const result = createBoardSchema.safeParse({
      name: "Board",
      slug: "board-v2",
    });
    expect(result.success).toBe(true);
  });

  it("rejects description over 500 characters", () => {
    const result = createBoardSchema.safeParse({
      name: "Board",
      slug: "board",
      description: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("updateBoardSchema", () => {
  const validCuid2 = "clh3av0e00000ml08n8lz6t5r0";

  it("accepts valid update with name only", () => {
    const result = updateBoardSchema.safeParse({
      boardId: validCuid2,
      name: "Updated Name",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid update with description only", () => {
    const result = updateBoardSchema.safeParse({
      boardId: validCuid2,
      description: "Updated description",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid boardId", () => {
    const result = updateBoardSchema.safeParse({
      boardId: "not-a-cuid",
      name: "Updated",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty boardId", () => {
    const result = updateBoardSchema.safeParse({
      boardId: "",
      name: "Updated",
    });
    expect(result.success).toBe(false);
  });
});

describe("deleteBoardSchema", () => {
  it("accepts valid cuid2 boardId", () => {
    const result = deleteBoardSchema.safeParse({
      boardId: "clh3av0e00000ml08n8lz6t5r0",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid boardId", () => {
    const result = deleteBoardSchema.safeParse({
      boardId: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("restoreBoardSchema", () => {
  it("accepts valid cuid2 boardId", () => {
    const result = restoreBoardSchema.safeParse({
      boardId: "clh3av0e00000ml08n8lz6t5r0",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid boardId", () => {
    const result = restoreBoardSchema.safeParse({
      boardId: "invalid",
    });
    expect(result.success).toBe(false);
  });
});
