import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserBoardsQuery, getBoardByIdQuery } from "./board.query";

const mockFindMany = vi.fn();
const mockFindUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    board: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

const mockGetSession = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockUser = { id: "user_1", name: "Test", email: "test@test.com" };
const mockSession = { user: mockUser, session: { id: "sess_1" } };

describe("getUserBoardsQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
  });

  it("returns boards owned by authenticated user", async () => {
    const boards = [
      { id: "board_1", name: "Board 1", slug: "board-1", ownerId: "user_1" },
      { id: "board_2", name: "Board 2", slug: "board-2", ownerId: "user_1" },
    ];
    mockFindMany.mockResolvedValue(boards);

    const result = await getUserBoardsQuery();

    expect(result.data).toEqual({ boards });
    expect(result.error).toBeNull();
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { ownerId: "user_1" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns error when user is not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await getUserBoardsQuery();

    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});

describe("getBoardByIdQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
  });

  it("returns board when owned by authenticated user", async () => {
    const board = {
      id: "board_1",
      name: "Board 1",
      slug: "board-1",
      ownerId: "user_1",
    };
    mockFindUnique.mockResolvedValue(board);

    const result = await getBoardByIdQuery("board_1");

    expect(result.data).toEqual({ board });
    expect(result.error).toBeNull();
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: "board_1" } });
  });

  it("returns null board when not owned by user", async () => {
    const board = {
      id: "board_1",
      name: "Board 1",
      slug: "board-1",
      ownerId: "other_user",
    };
    mockFindUnique.mockResolvedValue(board);

    const result = await getBoardByIdQuery("board_1");

    expect(result.data).toEqual({ board: null });
  });

  it("returns null board when not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await getBoardByIdQuery("nonexistent");

    expect(result.data).toEqual({ board: null });
  });

  it("returns error when user is not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await getBoardByIdQuery("board_1");

    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});
