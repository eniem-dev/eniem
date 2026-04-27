import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createFakePolarGateway,
  type FakePolarGateway,
} from "@/lib/polar/fake-polar-gateway";

const getSessionMock = vi.fn();
const getUserSubscriptionMock = vi.fn();
let fakeGateway: FakePolarGateway;

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => getSessionMock(...args),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), log: vi.fn() },
}));

vi.mock("@/lib/polar/index", () => ({
  get polar() {
    return fakeGateway;
  },
}));

vi.mock("../services/subscription.service", () => ({
  getUserSubscription: (...args: unknown[]) => getUserSubscriptionMock(...args),
}));

describe("getBillingOverviewQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fakeGateway = createFakePolarGateway();
    getSessionMock.mockResolvedValue({
      user: { id: "u1", email: "a@b.com" },
      session: { id: "s1" },
    });
  });

  it("returns subscription and orders for a user with a Polar customer", async () => {
    const subscription = { id: "sub_1", status: "active" };
    const orders = [
      {
        id: "ord_1",
        createdAt: new Date("2026-01-01"),
        status: "paid",
        totalAmount: 1000,
        currency: "usd",
        productName: "Pro",
        description: "Pro plan",
      },
    ];
    getUserSubscriptionMock.mockResolvedValue(subscription);
    fakeGateway.listUserOrders = vi.fn().mockResolvedValue(orders);

    const { getBillingOverviewQuery } = await import("./billing-overview.query");
    const result = await getBillingOverviewQuery();

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ subscription, orders });
    expect(fakeGateway.listUserOrders).toHaveBeenCalledWith("u1");
  });

  it("returns null subscription and empty orders for a user with no Polar customer", async () => {
    getUserSubscriptionMock.mockResolvedValue(null);

    const { getBillingOverviewQuery } = await import("./billing-overview.query");
    const result = await getBillingOverviewQuery();

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ subscription: null, orders: [] });
  });
});
