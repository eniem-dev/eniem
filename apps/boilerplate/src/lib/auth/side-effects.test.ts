import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createFakePolarGateway,
  type FakePolarGateway,
} from "@/lib/polar/fake-polar-gateway";
import type { PolarSubscription } from "@/lib/polar/polar-domain";

let fakeGateway: FakePolarGateway;

const upsertMock = vi.fn();
const deleteManyMock = vi.fn();

vi.mock("@/lib/polar/index", () => ({
  get polar() {
    return fakeGateway;
  },
  get polarClient() {
    return {};
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    subscription: {
      upsert: (...args: unknown[]) => upsertMock(...args),
      deleteMany: (...args: unknown[]) => deleteManyMock(...args),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/auth/config", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/config", () => ({
  env: {
    payment: { polarServer: "sandbox", polarWebhookSecret: "whsec_test" },
    projectUrl: "https://example.com",
    oauth: {
      github: { clientId: undefined, clientSecret: undefined },
      twitter: { clientId: undefined, clientSecret: undefined },
    },
  },
}));

const { logger } = await import("@/lib/logger");
const {
  getPurchasableProducts,
  onUserDeleted,
  onPolarCustomerStateChanged,
} = await import("./side-effects");

function makeSubscription(
  overrides: Partial<PolarSubscription> = {}
): PolarSubscription {
  return {
    id: "sub_1",
    productId: "prod_1",
    status: "active",
    recurringInterval: "month",
    amount: 1000,
    currency: "usd",
    currentPeriodStart: new Date("2026-01-01"),
    currentPeriodEnd: new Date("2026-02-01"),
    cancelAtPeriodEnd: false,
    canceledAt: null,
    startedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("getPurchasableProducts", () => {
  it("returns only products with concrete Polar product IDs", () => {
    const products = getPurchasableProducts("sandbox");

    expect(products.length).toBeGreaterThan(0);
    expect(products).toEqual(
      products.map((product) => ({
        productId: expect.any(String),
        slug: expect.any(String),
      }))
    );
  });
});

describe("onUserDeleted (integration with real PolarGateway fake)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fakeGateway = createFakePolarGateway();
    upsertMock.mockReset();
    deleteManyMock.mockReset();
  });

  it("deletes the Polar customer for the user", async () => {
    fakeGateway.seedCustomer({ userId: "u1", customerId: "polar_u1" });

    await onUserDeleted("u1");

    expect(await fakeGateway.getUserCustomerState("u1")).toBeNull();
  });

  it("logs and returns when Polar customer cleanup fails", async () => {
    fakeGateway.deleteUserCustomer = vi
      .fn()
      .mockRejectedValue(new Error("polar down"));

    await expect(onUserDeleted("u1")).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      "Polar customer cleanup failed after user deletion",
      { userId: "u1", error: "polar down" }
    );
  });

  it("does not log an error when Polar customer cleanup is already complete", async () => {
    await onUserDeleted("u1");

    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe("onPolarCustomerStateChanged (integration with real subscription service)", () => {
  beforeEach(() => {
    fakeGateway = createFakePolarGateway();
    upsertMock.mockReset();
    deleteManyMock.mockReset();
  });

  it("upserts a subscription row when active subscriptions are present", async () => {
    const sub = makeSubscription();
    upsertMock.mockResolvedValue({ userId: "u1", ...sub });

    await onPolarCustomerStateChanged("u1", [sub]);

    expect(upsertMock).toHaveBeenCalledTimes(1);
    const call = upsertMock.mock.calls[0][0];
    expect(call.where).toEqual({ userId: "u1" });
    expect(call.create).toMatchObject({
      userId: "u1",
      polarSubscriptionId: "sub_1",
      polarProductId: "prod_1",
      status: "active",
    });
    expect(call.update).toMatchObject({
      polarSubscriptionId: "sub_1",
      status: "active",
    });
  });

  it("deletes subscription rows when activeSubscriptions is empty", async () => {
    deleteManyMock.mockResolvedValue({ count: 1 });

    await onPolarCustomerStateChanged("u1", []);

    expect(upsertMock).not.toHaveBeenCalled();
    expect(deleteManyMock).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });
});
