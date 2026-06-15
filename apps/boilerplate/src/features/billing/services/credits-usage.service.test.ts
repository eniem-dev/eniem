import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createFakePolarGateway,
  type FakePolarGateway,
} from "@/lib/polar/fake-polar-gateway";

let fakeGateway: FakePolarGateway;

vi.mock("@/lib/polar/index", () => ({
  get polar() {
    return fakeGateway;
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/config", () => ({
  env: {
    payment: {
      polarServer: "sandbox",
    },
  },
}));

vi.mock("../generated/meters.generated", () => ({
  resolveEventDisplayName: (_env: string, eventName: string) => {
    const displayNames: Record<string, string> = {
      "use-credit": "LLM Tokens",
    };
    return displayNames[eventName] ?? eventName;
  },
}));

const { getUsageHistory } = await import("./credits-usage.service");

beforeEach(() => {
  fakeGateway = createFakePolarGateway();
});

describe("getUsageHistory", () => {
  it("returns formatted UsageHistoryEvent array with resolved display names", async () => {
    fakeGateway.seedCustomer({
      userId: "user_1",
      customerId: "polar_cust_1",
      usageEvents: [
        {
          id: "evt_1",
          name: "use-credit",
          timestamp: new Date("2026-02-10T12:00:00Z"),
          metadata: { model: "gpt-4", tokens: 150 },
        },
        {
          id: "evt_2",
          name: "unknown-event",
          timestamp: new Date("2026-02-10T12:00:00Z"),
          metadata: {},
        },
      ],
    });

    const result = await getUsageHistory("user_1");

    expect(result.events).toHaveLength(2);
    expect(result.events[0]).toEqual({
      id: "evt_1",
      name: "LLM Tokens",
      timestamp: new Date("2026-02-10T12:00:00Z"),
      metadata: { model: "gpt-4", tokens: 150 },
    });
    expect(result.events[1].name).toBe("unknown-event");
    expect(result.pagination.currentPage).toBe(1);
  });

  it("returns empty result when no Polar customer exists", async () => {
    const result = await getUsageHistory("user_unknown");

    expect(result.events).toEqual([]);
    expect(result.pagination).toEqual({
      totalCount: 0,
      maxPage: 1,
      currentPage: 1,
    });
  });

  it("returns empty events when customer has no usage events", async () => {
    fakeGateway.seedCustomer({
      userId: "user_1",
      customerId: "polar_cust_1",
      usageEvents: [],
    });

    const result = await getUsageHistory("user_1");

    expect(result.events).toEqual([]);
    expect(result.pagination.currentPage).toBe(1);
  });

  it("propagates pagination page option", async () => {
    fakeGateway.seedCustomer({
      userId: "user_1",
      customerId: "polar_cust_1",
      usageEvents: [],
    });

    const result = await getUsageHistory("user_1", { limit: 10, page: 3 });

    expect(result.pagination.currentPage).toBe(3);
  });

  it("re-throws on gateway failure", async () => {
    fakeGateway.listUsageHistory = vi
      .fn()
      .mockRejectedValue(new Error("API down"));

    await expect(getUsageHistory("user_1")).rejects.toThrow("API down");
  });
});
