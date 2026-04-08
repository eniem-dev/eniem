import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUsageHistory } from "./credits-usage.service";

const mockEventsList = vi.fn();
const mockGetCustomerId = vi.fn();

vi.mock("@/lib/polar", () => ({
  polarClient: {
    events: {
      list: (...args: unknown[]) => mockEventsList(...args),
    },
  },
}));

vi.mock("@/features/billing", () => ({
  getCustomerId: (...args: unknown[]) => mockGetCustomerId(...args),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/config", () => ({
  env: {
    payment: {
      polarServer: "sandbox",
    },
  },
}));

vi.mock("../meters.generated", () => ({
  resolveEventDisplayName: (env: string, eventName: string) => {
    const displayNames: Record<string, string> = {
      "use-credit": "LLM Tokens",
    };
    return displayNames[eventName] ?? eventName;
  },
}));

const makePolarEvent = (overrides: Record<string, unknown> = {}) => ({
  id: "evt_123",
  name: "use-credit",
  timestamp: new Date("2026-02-10T12:00:00Z"),
  metadata: { model: "gpt-4", tokens: 150 },
  source: "user" as const,
  customerId: "polar_cust_1",
  externalCustomerId: "user_1",
  organizationId: "org_1",
  customer: {},
  ...overrides,
});

describe("getUsageHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCustomerId.mockResolvedValue("polar_cust_1");
  });

  it("returns formatted UsageHistoryEvent array from Polar response", async () => {
    const event1 = makePolarEvent({ id: "evt_1", name: "use-credit" });
    const event2 = makePolarEvent({ id: "evt_2", name: "unknown-event" });

    mockEventsList.mockResolvedValue({
      result: {
        items: [event1, event2],
        pagination: { totalCount: 2, maxPage: 1 },
      },
    });

    const result = await getUsageHistory("user_1");

    expect(result.events).toHaveLength(2);
    expect(result.events[0]).toEqual({
      id: "evt_1",
      name: "LLM Tokens", // resolved from "use-credit"
      timestamp: event1.timestamp,
      metadata: event1.metadata,
    });
    expect(result.events[1].name).toBe("unknown-event"); // fallback for unknown
    expect(result.pagination).toEqual({
      totalCount: 2,
      maxPage: 1,
      currentPage: 1,
    });
  });

  it("returns empty result when no Polar customer exists", async () => {
    mockGetCustomerId.mockResolvedValue(null);

    const result = await getUsageHistory("user_1");

    expect(result.events).toEqual([]);
    expect(result.pagination).toEqual({
      totalCount: 0,
      maxPage: 1,
      currentPage: 1,
    });
    expect(mockEventsList).not.toHaveBeenCalled();
  });

  it("returns empty events + pagination when no customer events exist", async () => {
    mockEventsList.mockResolvedValue({
      result: {
        items: [],
        pagination: { totalCount: 0, maxPage: 0 },
      },
    });

    const result = await getUsageHistory("user_1");

    expect(result.events).toEqual([]);
    expect(result.pagination).toEqual({
      totalCount: 0,
      maxPage: 0,
      currentPage: 1,
    });
  });

  it("correctly maps UserEvent fields to UsageHistoryEvent", async () => {
    const event = makePolarEvent({
      id: "evt_map",
      name: "use-credit",
      timestamp: new Date("2026-01-15T08:30:00Z"),
      metadata: { pages: 5, format: "pdf", duplex: true },
    });

    mockEventsList.mockResolvedValue({
      result: {
        items: [event],
        pagination: { totalCount: 1, maxPage: 1 },
      },
    });

    const result = await getUsageHistory("user_1");
    const mapped = result.events[0];

    expect(mapped).toEqual({
      id: "evt_map",
      name: "LLM Tokens", // resolved from "use-credit"
      timestamp: new Date("2026-01-15T08:30:00Z"),
      metadata: { pages: 5, format: "pdf", duplex: true },
    });
    // Ensure extra Polar fields are NOT included
    expect(mapped).not.toHaveProperty("source");
    expect(mapped).not.toHaveProperty("customerId");
    expect(mapped).not.toHaveProperty("externalCustomerId");
  });

  it("passes limit and page options to Polar API with customerId", async () => {
    mockEventsList.mockResolvedValue({
      result: {
        items: [],
        pagination: { totalCount: 0, maxPage: 0 },
      },
    });

    await getUsageHistory("user_1", { limit: 10, page: 3 });

    expect(mockEventsList).toHaveBeenCalledWith({
      customerId: "polar_cust_1",
      limit: 10,
      page: 3,
      source: "user",
    });
  });

  it("logs and re-throws on Polar API error", async () => {
    mockEventsList.mockRejectedValue(new Error("API down"));

    await expect(getUsageHistory("user_1")).rejects.toThrow("API down");
  });
});
