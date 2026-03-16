import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    subscription: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/polar", () => ({
  polarClient: { customers: { getStateExternal: vi.fn() } },
}));

import { hasActiveSubscription } from "./subscription.service";

describe("hasActiveSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true for active subscription with future currentPeriodEnd", async () => {
    mockFindUnique.mockResolvedValue({
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 86400000),
    });

    expect(await hasActiveSubscription("user_1")).toBe(true);
  });

  it("returns false when no subscription exists", async () => {
    mockFindUnique.mockResolvedValue(null);

    expect(await hasActiveSubscription("user_1")).toBe(false);
  });

  it("returns false when status is not active", async () => {
    mockFindUnique.mockResolvedValue({
      status: "canceled",
      currentPeriodEnd: new Date(Date.now() + 86400000),
    });

    expect(await hasActiveSubscription("user_1")).toBe(false);
  });

  it("returns false when currentPeriodEnd is in the past despite active status", async () => {
    mockFindUnique.mockResolvedValue({
      status: "active",
      currentPeriodEnd: new Date(Date.now() - 86400000),
    });

    expect(await hasActiveSubscription("user_1")).toBe(false);
  });
});
