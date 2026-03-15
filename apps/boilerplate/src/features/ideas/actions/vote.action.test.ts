import { describe, it, expect, vi, beforeEach } from "vitest";
import { locales } from "@/locales";

const mockIdeaFindUnique = vi.fn();
const mockVoteFindUnique = vi.fn();
const mockVoteCreate = vi.fn();
const mockVoteDelete = vi.fn();
const mockVoteCount = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    idea: {
      findUnique: (...args: unknown[]) => mockIdeaFindUnique(...args),
    },
    vote: {
      findUnique: (...args: unknown[]) => mockVoteFindUnique(...args),
      create: (...args: unknown[]) => mockVoteCreate(...args),
      delete: (...args: unknown[]) => mockVoteDelete(...args),
      count: (...args: unknown[]) => mockVoteCount(...args),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
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

const mockIdea = {
  id: "clyyyyyyyyyyyyyyyyyyyyyyyy",
  title: "My Idea",
  boardId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
  authorId: "user_1",
  board: { slug: "my-board", deletedAt: null },
};

describe("toggleVoteAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockIdeaFindUnique.mockResolvedValue(mockIdea);
    mockVoteCount.mockResolvedValue(1);
  });

  it("creates a vote when user has not voted", async () => {
    mockVoteFindUnique.mockResolvedValue(null);
    mockVoteCreate.mockResolvedValue({ id: "vote_1" });

    const { toggleVoteAction } = await import("./vote.action");
    const result = await toggleVoteAction({ ideaId: mockIdea.id });

    expect(result?.data?.voted).toBe(true);
    expect(result?.data?.count).toBe(1);
    expect(mockVoteCreate).toHaveBeenCalledWith({
      data: { ideaId: mockIdea.id, userId: "user_1" },
    });
  });

  it("removes a vote when user has already voted", async () => {
    mockVoteFindUnique.mockResolvedValue({ id: "vote_1" });
    mockVoteDelete.mockResolvedValue({ id: "vote_1" });
    mockVoteCount.mockResolvedValue(0);

    const { toggleVoteAction } = await import("./vote.action");
    const result = await toggleVoteAction({ ideaId: mockIdea.id });

    expect(result?.data?.voted).toBe(false);
    expect(result?.data?.count).toBe(0);
    expect(mockVoteDelete).toHaveBeenCalledWith({
      where: { id: "vote_1" },
    });
  });

  it("rejects when idea not found", async () => {
    mockIdeaFindUnique.mockResolvedValue(null);

    const { toggleVoteAction } = await import("./vote.action");
    const result = await toggleVoteAction({ ideaId: mockIdea.id });

    expect(result?.serverError).toBe(locales.errors.voteIdeaNotFound);
    expect(mockVoteCreate).not.toHaveBeenCalled();
  });

  it("rejects when board is soft-deleted", async () => {
    mockIdeaFindUnique.mockResolvedValue({
      ...mockIdea,
      board: { slug: "my-board", deletedAt: new Date() },
    });

    const { toggleVoteAction } = await import("./vote.action");
    const result = await toggleVoteAction({ ideaId: mockIdea.id });

    expect(result?.serverError).toBe(locales.errors.voteIdeaNotFound);
    expect(mockVoteCreate).not.toHaveBeenCalled();
  });
});
