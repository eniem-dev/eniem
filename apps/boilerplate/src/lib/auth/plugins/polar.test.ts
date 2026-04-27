import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PolarSubscription } from "../side-effects";

const onPolarCustomerStateChangedMock = vi.fn();

vi.mock("../side-effects", () => ({
  polarClient: {},
  getPurchasableProducts: () => [],
  onPolarCustomerStateChanged: (...args: unknown[]) =>
    onPolarCustomerStateChangedMock(...args),
}));

vi.mock("@/config", () => ({
  env: {
    payment: {
      polarServer: "sandbox",
      polarWebhookSecret: "whsec_test",
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const { onCustomerStateChanged } = await import("./polar");

function makeSubscription(): PolarSubscription {
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
  };
}

describe("polar plugin onCustomerStateChanged", () => {
  beforeEach(() => {
    onPolarCustomerStateChangedMock.mockReset();
  });

  it("forwards externalId and activeSubscriptions to sideEffects", async () => {
    const sub = makeSubscription();
    await onCustomerStateChanged({
      data: { externalId: "user_42", activeSubscriptions: [sub] },
    });

    expect(onPolarCustomerStateChangedMock).toHaveBeenCalledTimes(1);
    expect(onPolarCustomerStateChangedMock).toHaveBeenCalledWith("user_42", [
      sub,
    ]);
  });

  it("defaults activeSubscriptions to [] when missing", async () => {
    await onCustomerStateChanged({
      data: { externalId: "user_1", activeSubscriptions: null },
    });

    expect(onPolarCustomerStateChangedMock).toHaveBeenCalledWith("user_1", []);
  });

  it("skips dispatch when externalId is absent (anonymous customer)", async () => {
    await onCustomerStateChanged({
      data: { externalId: null, activeSubscriptions: [] },
    });

    expect(onPolarCustomerStateChangedMock).not.toHaveBeenCalled();
  });
});
