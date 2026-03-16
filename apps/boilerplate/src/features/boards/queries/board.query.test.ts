import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getUserBoardsQuery,
  getBoardByIdQuery,
  getBoardBySlugQuery,
} from "./board.query";

const mockFindMany = vi.fn();
const mockFindUnique = vi.fn();

const mockIdeaFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    board: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    idea: {
      findMany: (...args: unknown[]) => mockIdeaFindMany(...args),
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

  it("returns board with ideas when owned by authenticated user", async () => {
    const board = {
      id: "board_1",
      name: "Board 1",
      slug: "board-1",
      ownerId: "user_1",
      ideas: [
        {
          id: "idea_1",
          title: "Idea 1",
          description: "Desc",
          status: "OPEN",
          adminResponse: null,
          createdAt: new Date("2026-01-01"),
          author: { id: "u1", name: "Alice" },
          _count: { votes: 3 },
        },
      ],
      _count: { ideas: 1 },
    };
    mockFindUnique.mockResolvedValue(board);

    const result = await getBoardByIdQuery("board_1");

    expect(result.data?.board?._count).toEqual({ ideas: 1, votes: 3 });
    expect(result.data?.ideas).toHaveLength(1);
    expect(result.data?.ideas?.[0].title).toBe("Idea 1");
    expect(result.data?.ideas?.[0].voteCount).toBe(3);
    expect(result.error).toBeNull();
  });

  it("returns null board when not owned by user", async () => {
    const board = {
      id: "board_1",
      name: "Board 1",
      slug: "board-1",
      ownerId: "other_user",
      ideas: [],
      _count: { ideas: 0 },
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

describe("getBoardBySlugQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
  });

  it("returns board with ideas sorted by votes", async () => {
    const board = {
      id: "board_1",
      name: "My Board",
      slug: "my-board",
      description: "A test board",
      ownerId: "user_1",
    };
    mockFindUnique.mockResolvedValue(board);

    const ideas = [
      {
        id: "idea_1",
        title: "Popular",
        description: "Desc",
        status: "OPEN",
        adminResponse: null,
        createdAt: new Date("2026-01-01"),
        author: { id: "u1", name: "Alice", image: null },
        _count: { votes: 5 },
        votes: [{ id: "v1" }],
      },
      {
        id: "idea_2",
        title: "Less popular",
        description: null,
        status: "PLANNED",
        adminResponse: "Thanks",
        createdAt: new Date("2026-01-02"),
        author: { id: "u2", name: "Bob", image: null },
        _count: { votes: 2 },
        votes: [],
      },
    ];
    mockIdeaFindMany.mockResolvedValue(ideas);

    const result = await getBoardBySlugQuery("my-board");

    expect(result.data).not.toBeNull();
    expect(result.data!.board.name).toBe("My Board");
    expect(result.data!.ideas).toHaveLength(2);
    expect(result.data!.ideas[0].voteCount).toBe(5);
    expect(result.data!.ideas[0].hasVoted).toBe(true);
    expect(result.data!.ideas[1].hasVoted).toBe(false);
    expect(result.data!.isAuthenticated).toBe(true);
    expect(result.data!.currentUserId).toBe("user_1");
  });

  it("returns null for non-existent board", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await getBoardBySlugQuery("nonexistent");

    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });

  it("filters ideas by status when provided", async () => {
    const board = {
      id: "board_1",
      name: "Board",
      slug: "board",
      description: null,
      ownerId: "user_1",
    };
    mockFindUnique.mockResolvedValue(board);
    mockIdeaFindMany.mockResolvedValue([]);

    await getBoardBySlugQuery("board", { status: "PLANNED" });

    expect(mockIdeaFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { boardId: "board_1", status: "PLANNED" },
      })
    );
  });

  it("works for unauthenticated users", async () => {
    mockGetSession.mockResolvedValue(null);

    const board = {
      id: "board_1",
      name: "Board",
      slug: "board",
      description: null,
      ownerId: "user_1",
    };
    mockFindUnique.mockResolvedValue(board);
    mockIdeaFindMany.mockResolvedValue([]);

    const result = await getBoardBySlugQuery("board");

    expect(result.data!.isAuthenticated).toBe(false);
    expect(result.data!.currentUserId).toBeNull();
  });
});
