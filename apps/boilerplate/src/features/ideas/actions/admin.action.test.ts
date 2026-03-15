import { describe, it, expect, vi, beforeEach } from "vitest";
import { locales } from "@/locales";

const mockIdeaFindUnique = vi.fn();
const mockIdeaUpdate = vi.fn();
const mockHasActiveSubscription = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    idea: {
      findUnique: (...args: unknown[]) => mockIdeaFindUnique(...args),
      update: (...args: unknown[]) => mockIdeaUpdate(...args),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/subscription/services/subscription.service", () => ({
  hasActiveSubscription: (...args: unknown[]) =>
    mockHasActiveSubscription(...args),
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

const mockOwner = { id: "owner_1", name: "Owner", email: "owner@test.com" };
const mockSession = { user: mockOwner, session: { id: "sess_1" } };

const mockIdea = {
  id: "clyyyyyyyyyyyyyyyyyyyyyyyy",
  title: "My Idea",
  status: "OPEN",
  adminResponse: null,
  boardId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
  authorId: "user_1",
  board: { ownerId: "owner_1", slug: "my-board" },
};

describe("updateIdeaStatusAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockIdeaFindUnique.mockResolvedValue(mockIdea);
    mockHasActiveSubscription.mockResolvedValue(true);
    mockIdeaUpdate.mockResolvedValue({ ...mockIdea, status: "PLANNED" });
  });

  it("updates idea status when user is board owner with active subscription", async () => {
    const { updateIdeaStatusAction } = await import("./admin.action");
    const result = await updateIdeaStatusAction({
      ideaId: mockIdea.id,
      status: "PLANNED",
    });

    expect(result?.data?.success).toBe(true);
    expect(mockIdeaUpdate).toHaveBeenCalledWith({
      where: { id: mockIdea.id },
      data: { status: "PLANNED" },
    });
  });

  it("rejects when idea not found", async () => {
    mockIdeaFindUnique.mockResolvedValue(null);

    const { updateIdeaStatusAction } = await import("./admin.action");
    const result = await updateIdeaStatusAction({
      ideaId: mockIdea.id,
      status: "PLANNED",
    });

    expect(result?.serverError).toBe(locales.errors.ideaNotFound);
    expect(mockIdeaUpdate).not.toHaveBeenCalled();
  });

  it("rejects when user is not the board owner", async () => {
    mockIdeaFindUnique.mockResolvedValue({
      ...mockIdea,
      board: { ownerId: "other_owner", slug: "my-board" },
    });

    const { updateIdeaStatusAction } = await import("./admin.action");
    const result = await updateIdeaStatusAction({
      ideaId: mockIdea.id,
      status: "PLANNED",
    });

    expect(result?.serverError).toBe(locales.errors.unauthorized);
    expect(mockIdeaUpdate).not.toHaveBeenCalled();
  });

  it("rejects when subscription is inactive", async () => {
    mockHasActiveSubscription.mockResolvedValue(false);

    const { updateIdeaStatusAction } = await import("./admin.action");
    const result = await updateIdeaStatusAction({
      ideaId: mockIdea.id,
      status: "DONE",
    });

    expect(result?.serverError).toBe(locales.errors.subscriptionRequired);
    expect(mockIdeaUpdate).not.toHaveBeenCalled();
  });
});

describe("setAdminResponseAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockIdeaFindUnique.mockResolvedValue(mockIdea);
    mockHasActiveSubscription.mockResolvedValue(true);
    mockIdeaUpdate.mockResolvedValue({
      ...mockIdea,
      adminResponse: "We'll look into it",
    });
  });

  it("sets admin response when user is board owner with active subscription", async () => {
    const { setAdminResponseAction } = await import("./admin.action");
    const result = await setAdminResponseAction({
      ideaId: mockIdea.id,
      response: "We'll look into it",
    });

    expect(result?.data?.success).toBe(true);
    expect(mockIdeaUpdate).toHaveBeenCalledWith({
      where: { id: mockIdea.id },
      data: { adminResponse: "We'll look into it" },
    });
  });

  it("removes admin response when set to null", async () => {
    mockIdeaUpdate.mockResolvedValue({ ...mockIdea, adminResponse: null });

    const { setAdminResponseAction } = await import("./admin.action");
    const result = await setAdminResponseAction({
      ideaId: mockIdea.id,
      response: null,
    });

    expect(result?.data?.success).toBe(true);
    expect(mockIdeaUpdate).toHaveBeenCalledWith({
      where: { id: mockIdea.id },
      data: { adminResponse: null },
    });
  });

  it("rejects when idea not found", async () => {
    mockIdeaFindUnique.mockResolvedValue(null);

    const { setAdminResponseAction } = await import("./admin.action");
    const result = await setAdminResponseAction({
      ideaId: mockIdea.id,
      response: "Response",
    });

    expect(result?.serverError).toBe(locales.errors.ideaNotFound);
    expect(mockIdeaUpdate).not.toHaveBeenCalled();
  });

  it("rejects when user is not the board owner", async () => {
    mockIdeaFindUnique.mockResolvedValue({
      ...mockIdea,
      board: { ownerId: "other_owner", slug: "my-board" },
    });

    const { setAdminResponseAction } = await import("./admin.action");
    const result = await setAdminResponseAction({
      ideaId: mockIdea.id,
      response: "Response",
    });

    expect(result?.serverError).toBe(locales.errors.unauthorized);
    expect(mockIdeaUpdate).not.toHaveBeenCalled();
  });

  it("rejects when subscription is inactive", async () => {
    mockHasActiveSubscription.mockResolvedValue(false);

    const { setAdminResponseAction } = await import("./admin.action");
    const result = await setAdminResponseAction({
      ideaId: mockIdea.id,
      response: "Response",
    });

    expect(result?.serverError).toBe(locales.errors.subscriptionRequired);
    expect(mockIdeaUpdate).not.toHaveBeenCalled();
  });
});
