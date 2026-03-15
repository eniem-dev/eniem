import { describe, it, expect, vi, beforeEach } from "vitest";
import { getIdeasByBoardQuery, getIdeaByIdQuery } from "./idea.query";

const mockBoardFindUnique = vi.fn();
const mockIdeaFindMany = vi.fn();
const mockIdeaFindUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    board: {
      findUnique: (...args: unknown[]) => mockBoardFindUnique(...args),
    },
    idea: {
      findMany: (...args: unknown[]) => mockIdeaFindMany(...args),
      findUnique: (...args: unknown[]) => mockIdeaFindUnique(...args),
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

describe("getIdeasByBoardQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
  });

  it("returns ideas with vote data for an existing board", async () => {
    const board = { id: "board_1", ownerId: "user_1" };
    const ideas = [
      {
        id: "idea_1",
        title: "Feature A",
        boardId: "board_1",
        authorId: "user_1",
        author: { id: "user_1", name: "Test", image: null },
        _count: { votes: 3 },
        votes: [{ id: "vote_1" }],
      },
    ];
    mockBoardFindUnique.mockResolvedValue(board);
    mockIdeaFindMany.mockResolvedValue(ideas);

    const result = await getIdeasByBoardQuery("board_1");

    expect(result.data?.ideas).toEqual([
      expect.objectContaining({
        id: "idea_1",
        title: "Feature A",
        voteCount: 3,
        hasVoted: true,
      }),
    ]);
    expect(result.data?.isOwner).toBe(true);
    expect(result.error).toBeNull();
  });

  it("returns isOwner false when user does not own the board", async () => {
    const board = { id: "board_1", ownerId: "other_user" };
    mockBoardFindUnique.mockResolvedValue(board);
    mockIdeaFindMany.mockResolvedValue([]);

    const result = await getIdeasByBoardQuery("board_1");

    expect(result.data).toEqual({ ideas: [], isOwner: false });
  });

  it("returns empty ideas when board not found", async () => {
    mockBoardFindUnique.mockResolvedValue(null);

    const result = await getIdeasByBoardQuery("nonexistent");

    expect(result.data).toEqual({ ideas: [], isOwner: false });
    expect(mockIdeaFindMany).not.toHaveBeenCalled();
  });

  it("works for unauthenticated users", async () => {
    mockGetSession.mockResolvedValue(null);
    const board = { id: "board_1", ownerId: "owner_1" };
    const ideas = [
      {
        id: "idea_1",
        title: "Feature A",
        boardId: "board_1",
        authorId: "user_1",
        author: { id: "user_1", name: "Test", image: null },
        _count: { votes: 2 },
      },
    ];
    mockBoardFindUnique.mockResolvedValue(board);
    mockIdeaFindMany.mockResolvedValue(ideas);

    const result = await getIdeasByBoardQuery("board_1");

    expect(result.data?.ideas).toEqual([
      expect.objectContaining({
        id: "idea_1",
        voteCount: 2,
        hasVoted: false,
      }),
    ]);
    expect(result.data?.isOwner).toBe(false);
  });
});

describe("getIdeaByIdQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
  });

  it("returns idea with author and ownership flags", async () => {
    const idea = {
      id: "idea_1",
      title: "Feature A",
      description: "Details",
      authorId: "user_1",
      boardId: "board_1",
      author: { id: "user_1", name: "Test", image: null },
      board: { id: "board_1", ownerId: "user_1" },
    };
    mockIdeaFindUnique.mockResolvedValue(idea);

    const result = await getIdeaByIdQuery("idea_1");

    expect(result.data).toEqual({
      idea: { ...idea, isAuthor: true, isBoardOwner: true },
    });
    expect(result.error).toBeNull();
  });

  it("returns isAuthor false when user is not the author", async () => {
    const idea = {
      id: "idea_1",
      title: "Feature A",
      authorId: "other_user",
      boardId: "board_1",
      author: { id: "other_user", name: "Other", image: null },
      board: { id: "board_1", ownerId: "another_user" },
    };
    mockIdeaFindUnique.mockResolvedValue(idea);

    const result = await getIdeaByIdQuery("idea_1");

    expect(result.data).toEqual({
      idea: { ...idea, isAuthor: false, isBoardOwner: false },
    });
  });

  it("returns null idea when not found", async () => {
    mockIdeaFindUnique.mockResolvedValue(null);

    const result = await getIdeaByIdQuery("nonexistent");

    expect(result.data).toEqual({ idea: null });
  });

  it("returns error when user is not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await getIdeaByIdQuery("idea_1");

    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
    expect(mockIdeaFindUnique).not.toHaveBeenCalled();
  });
});
