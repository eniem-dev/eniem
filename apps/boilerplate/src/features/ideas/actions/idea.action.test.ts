import { describe, it, expect, vi, beforeEach } from "vitest";
import { locales } from "@/locales";

const mockIdeaCreate = vi.fn();
const mockIdeaFindUnique = vi.fn();
const mockIdeaUpdate = vi.fn();
const mockIdeaDelete = vi.fn();
const mockBoardFindUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    board: {
      findUnique: (...args: unknown[]) => mockBoardFindUnique(...args),
    },
    idea: {
      create: (...args: unknown[]) => mockIdeaCreate(...args),
      findUnique: (...args: unknown[]) => mockIdeaFindUnique(...args),
      update: (...args: unknown[]) => mockIdeaUpdate(...args),
      delete: (...args: unknown[]) => mockIdeaDelete(...args),
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

const mockBoard = {
  id: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
  slug: "my-board",
  ownerId: "owner_1",
  deletedAt: null,
};

const mockIdea = {
  id: "clyyyyyyyyyyyyyyyyyyyyyyyy",
  title: "My Idea",
  description: "A great idea",
  status: "OPEN",
  boardId: mockBoard.id,
  authorId: "user_1",
  board: { slug: "my-board", ownerId: "owner_1" },
};

describe("createIdeaAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockBoardFindUnique.mockResolvedValue(mockBoard);
    mockIdeaCreate.mockResolvedValue({
      id: "idea_1",
      title: "My Idea",
      description: null,
      status: "OPEN",
      boardId: mockBoard.id,
      authorId: "user_1",
    });
  });

  it("creates an idea on a valid board", async () => {
    const { createIdeaAction } = await import("./idea.action");
    const result = await createIdeaAction({
      boardId: mockBoard.id,
      title: "My Idea",
    });

    expect(result?.data?.idea).toEqual({
      id: "idea_1",
      title: "My Idea",
      description: null,
      status: "OPEN",
      boardId: mockBoard.id,
      authorId: "user_1",
    });
    expect(mockIdeaCreate).toHaveBeenCalledWith({
      data: {
        title: "My Idea",
        description: null,
        boardId: mockBoard.id,
        authorId: "user_1",
      },
    });
  });

  it("stores empty description as null", async () => {
    const { createIdeaAction } = await import("./idea.action");
    await createIdeaAction({
      boardId: mockBoard.id,
      title: "My Idea",
      description: "",
    });

    expect(mockIdeaCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ description: null }),
    });
  });

  it("rejects when board not found", async () => {
    mockBoardFindUnique.mockResolvedValue(null);

    const { createIdeaAction } = await import("./idea.action");
    const result = await createIdeaAction({
      boardId: mockBoard.id,
      title: "My Idea",
    });

    expect(result?.serverError).toBe(locales.errors.boardNotFound);
    expect(mockIdeaCreate).not.toHaveBeenCalled();
  });

  it("rejects when board is soft-deleted", async () => {
    mockBoardFindUnique.mockResolvedValue({
      ...mockBoard,
      deletedAt: new Date(),
    });

    const { createIdeaAction } = await import("./idea.action");
    const result = await createIdeaAction({
      boardId: mockBoard.id,
      title: "My Idea",
    });

    expect(result?.serverError).toBe(locales.errors.boardNotFound);
    expect(mockIdeaCreate).not.toHaveBeenCalled();
  });
});

describe("updateIdeaAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockIdeaFindUnique.mockResolvedValue(mockIdea);
    mockIdeaUpdate.mockImplementation(({ data }) => ({
      ...mockIdea,
      ...data,
    }));
  });

  it("updates title and description", async () => {
    const { updateIdeaAction } = await import("./idea.action");
    const result = await updateIdeaAction({
      ideaId: mockIdea.id,
      title: "Updated Title",
      description: "Updated description",
    });

    expect(result?.data?.idea.title).toBe("Updated Title");
    expect(mockIdeaUpdate).toHaveBeenCalledWith({
      where: { id: mockIdea.id },
      data: {
        title: "Updated Title",
        description: "Updated description",
      },
    });
  });

  it("rejects when idea not found", async () => {
    mockIdeaFindUnique.mockResolvedValue(null);

    const { updateIdeaAction } = await import("./idea.action");
    const result = await updateIdeaAction({
      ideaId: mockIdea.id,
      title: "Updated",
    });

    expect(result?.serverError).toBe(locales.errors.ideaNotFound);
    expect(mockIdeaUpdate).not.toHaveBeenCalled();
  });

  it("rejects when user is not the author", async () => {
    mockIdeaFindUnique.mockResolvedValue({
      ...mockIdea,
      authorId: "other_user",
    });

    const { updateIdeaAction } = await import("./idea.action");
    const result = await updateIdeaAction({
      ideaId: mockIdea.id,
      title: "Updated",
    });

    expect(result?.serverError).toBe(locales.errors.unauthorized);
    expect(mockIdeaUpdate).not.toHaveBeenCalled();
  });
});

describe("deleteIdeaAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockIdeaFindUnique.mockResolvedValue(mockIdea);
    mockIdeaDelete.mockResolvedValue(mockIdea);
  });

  it("deletes when user is the author", async () => {
    const { deleteIdeaAction } = await import("./idea.action");
    const result = await deleteIdeaAction({ ideaId: mockIdea.id });

    expect(result?.data?.success).toBe(true);
    expect(mockIdeaDelete).toHaveBeenCalledWith({
      where: { id: mockIdea.id },
    });
  });

  it("deletes when user is the board owner", async () => {
    mockIdeaFindUnique.mockResolvedValue({
      ...mockIdea,
      authorId: "other_user",
      board: { slug: "my-board", ownerId: "user_1" },
    });

    const { deleteIdeaAction } = await import("./idea.action");
    const result = await deleteIdeaAction({ ideaId: mockIdea.id });

    expect(result?.data?.success).toBe(true);
    expect(mockIdeaDelete).toHaveBeenCalled();
  });

  it("rejects when idea not found", async () => {
    mockIdeaFindUnique.mockResolvedValue(null);

    const { deleteIdeaAction } = await import("./idea.action");
    const result = await deleteIdeaAction({ ideaId: mockIdea.id });

    expect(result?.serverError).toBe(locales.errors.ideaNotFound);
    expect(mockIdeaDelete).not.toHaveBeenCalled();
  });

  it("rejects when user is neither author nor board owner", async () => {
    mockIdeaFindUnique.mockResolvedValue({
      ...mockIdea,
      authorId: "other_user",
      board: { slug: "my-board", ownerId: "another_user" },
    });

    const { deleteIdeaAction } = await import("./idea.action");
    const result = await deleteIdeaAction({ ideaId: mockIdea.id });

    expect(result?.serverError).toBe(locales.errors.unauthorized);
    expect(mockIdeaDelete).not.toHaveBeenCalled();
  });
});
