import { describe, it, expect, vi, beforeEach } from "vitest";
import { locales } from "@/locales";

const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    board: {
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
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

const mockHasActiveSubscription = vi.fn();

vi.mock("@/features/subscription/services/subscription.service", () => ({
  hasActiveSubscription: (...args: unknown[]) =>
    mockHasActiveSubscription(...args),
}));

const mockUser = { id: "user_1", name: "Test", email: "test@test.com" };
const mockSession = { user: mockUser, session: { id: "sess_1" } };

const validInput = {
  name: "My Board",
  slug: "my-board",
  description: "A test board",
};

describe("createBoardAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockHasActiveSubscription.mockResolvedValue(true);
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: "board_1",
      ...validInput,
      ownerId: "user_1",
    });
  });

  it("creates a board when user has active subscription", async () => {
    const { createBoardAction } = await import("./board.action");
    const result = await createBoardAction(validInput);

    expect(result?.data?.board).toEqual({
      id: "board_1",
      ...validInput,
      ownerId: "user_1",
    });
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        name: "My Board",
        slug: "my-board",
        description: "A test board",
        ownerId: "user_1",
      },
    });
  });

  it("rejects when no active subscription", async () => {
    mockHasActiveSubscription.mockResolvedValue(false);

    const { createBoardAction } = await import("./board.action");
    const result = await createBoardAction(validInput);

    expect(result?.serverError).toBe(locales.errors.subscriptionRequired);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects duplicate slug with specific error message", async () => {
    mockFindUnique.mockResolvedValue({ id: "existing_board", slug: "my-board" });

    const { createBoardAction } = await import("./board.action");
    const result = await createBoardAction(validInput);

    expect(result?.serverError).toBe(locales.errors.slugTaken);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

const mockBoard = {
  id: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
  name: "My Board",
  slug: "my-board",
  description: "A test board",
  ownerId: "user_1",
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("updateBoardAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockFindUnique.mockResolvedValue(mockBoard);
    mockUpdate.mockImplementation(({ data }) => ({
      ...mockBoard,
      ...data,
    }));
  });

  it("updates name and description", async () => {
    const { updateBoardAction } = await import("./board.action");
    const result = await updateBoardAction({
      boardId: mockBoard.id,
      name: "Updated Name",
      description: "Updated description",
    });

    expect(result?.data?.board.name).toBe("Updated Name");
    expect(result?.data?.board.description).toBe("Updated description");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: mockBoard.id },
      data: { name: "Updated Name", description: "Updated description" },
    });
  });

  it("rejects when board not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const { updateBoardAction } = await import("./board.action");
    const result = await updateBoardAction({
      boardId: mockBoard.id,
      name: "Updated",
    });

    expect(result?.serverError).toBe(locales.errors.boardNotFound);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects when user is not the owner", async () => {
    mockFindUnique.mockResolvedValue({ ...mockBoard, ownerId: "other_user" });

    const { updateBoardAction } = await import("./board.action");
    const result = await updateBoardAction({
      boardId: mockBoard.id,
      name: "Updated",
    });

    expect(result?.serverError).toBe(locales.errors.unauthorized);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("deleteBoardAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockFindUnique.mockResolvedValue(mockBoard);
    mockUpdate.mockImplementation(({ data }) => ({
      ...mockBoard,
      ...data,
    }));
  });

  it("soft-deletes by setting deletedAt", async () => {
    const { deleteBoardAction } = await import("./board.action");
    const result = await deleteBoardAction({ boardId: mockBoard.id });

    expect(result?.data?.board.deletedAt).toBeInstanceOf(Date);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: mockBoard.id },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it("rejects when board not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const { deleteBoardAction } = await import("./board.action");
    const result = await deleteBoardAction({ boardId: mockBoard.id });

    expect(result?.serverError).toBe(locales.errors.boardNotFound);
  });

  it("rejects when user is not the owner", async () => {
    mockFindUnique.mockResolvedValue({ ...mockBoard, ownerId: "other_user" });

    const { deleteBoardAction } = await import("./board.action");
    const result = await deleteBoardAction({ boardId: mockBoard.id });

    expect(result?.serverError).toBe(locales.errors.unauthorized);
  });
});

describe("restoreBoardAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockFindUnique.mockResolvedValue({ ...mockBoard, deletedAt: new Date() });
    mockUpdate.mockImplementation(({ data }) => ({
      ...mockBoard,
      ...data,
    }));
  });

  it("restores by clearing deletedAt", async () => {
    const { restoreBoardAction } = await import("./board.action");
    const result = await restoreBoardAction({ boardId: mockBoard.id });

    expect(result?.data?.board.deletedAt).toBeNull();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: mockBoard.id },
      data: { deletedAt: null },
    });
  });

  it("rejects when board not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const { restoreBoardAction } = await import("./board.action");
    const result = await restoreBoardAction({ boardId: mockBoard.id });

    expect(result?.serverError).toBe(locales.errors.boardNotFound);
  });

  it("rejects when user is not the owner", async () => {
    mockFindUnique.mockResolvedValue({ ...mockBoard, ownerId: "other_user" });

    const { restoreBoardAction } = await import("./board.action");
    const result = await restoreBoardAction({ boardId: mockBoard.id });

    expect(result?.serverError).toBe(locales.errors.unauthorized);
  });
});
