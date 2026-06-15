import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResourceNotFound } from "@polar-sh/sdk/models/errors/resourcenotfound.js";
import type { Polar } from "@polar-sh/sdk";
import { createPolarGateway } from "./polar-gateway";

function makeNotFound(): ResourceNotFound {
  return new ResourceNotFound(
    { error: "ResourceNotFound", detail: "not found", message: "not found" },
    { request: new Request("http://x/"), response: new Response(), body: "{}" }
  );
}

interface MockClient {
  customers: {
    getExternal: ReturnType<typeof vi.fn>;
    getStateExternal: ReturnType<typeof vi.fn>;
    deleteExternal: ReturnType<typeof vi.fn>;
  };
  orders: { list: ReturnType<typeof vi.fn> };
  events: {
    list: ReturnType<typeof vi.fn>;
    ingest: ReturnType<typeof vi.fn>;
  };
  customerSessions: { create: ReturnType<typeof vi.fn> };
  customerPortal: {
    benefitGrants: { list: ReturnType<typeof vi.fn> };
    downloadables: { list: ReturnType<typeof vi.fn> };
  };
}

function makeClient(): MockClient {
  return {
    customers: {
      getExternal: vi.fn(),
      getStateExternal: vi.fn(),
      deleteExternal: vi.fn(),
    },
    orders: { list: vi.fn() },
    events: { list: vi.fn(), ingest: vi.fn() },
    customerSessions: { create: vi.fn() },
    customerPortal: {
      benefitGrants: { list: vi.fn() },
      downloadables: { list: vi.fn() },
    },
  };
}

function makeGateway(client: MockClient) {
  return createPolarGateway(client as unknown as Polar);
}

const baseOrder = {
  id: "order_1",
  createdAt: new Date("2026-01-01"),
  status: "paid",
  totalAmount: 1000,
  currency: "USD",
  product: { name: "Pro Plan", description: "A plan" },
};

const baseState = {
  id: "cust_1",
  createdAt: new Date("2026-01-01"),
  modifiedAt: null,
  metadata: {},
  externalId: "user_1",
  email: "u@e.test",
  emailVerified: true,
  name: null,
  billingAddress: null,
  taxId: null,
  organizationId: "org_1",
  deletedAt: null,
  activeSubscriptions: [],
  grantedBenefits: [],
  activeMeters: [],
  avatarUrl: "",
};

describe("PolarGateway", () => {
  let client: MockClient;
  beforeEach(() => {
    client = makeClient();
  });

  describe("listUserOrders", () => {
    it("maps SDK orders into BillingOrder on happy path", async () => {
      client.customers.getExternal.mockResolvedValue({ id: "cust_1" });
      client.orders.list.mockResolvedValue({
        result: { items: [baseOrder] },
      });

      const result = await makeGateway(client).listUserOrders("user_1");

      expect(result).toEqual([
        {
          id: "order_1",
          createdAt: baseOrder.createdAt,
          status: "paid",
          totalAmount: 1000,
          currency: "USD",
          productName: "Pro Plan",
          description: "A plan",
        },
      ]);
    });

    it("returns [] when customer is not found", async () => {
      client.customers.getExternal.mockRejectedValue(makeNotFound());
      const result = await makeGateway(client).listUserOrders("user_1");
      expect(result).toEqual([]);
      expect(client.orders.list).not.toHaveBeenCalled();
    });

    it("returns orders after a missing customer lookup later resolves", async () => {
      client.customers.getExternal
        .mockRejectedValueOnce(makeNotFound())
        .mockResolvedValueOnce({ id: "cust_1" });
      client.orders.list.mockResolvedValue({
        result: { items: [baseOrder] },
      });
      const gateway = makeGateway(client);

      expect(await gateway.listUserOrders("user_1")).toEqual([]);
      const result = await gateway.listUserOrders("user_1");

      expect(result).toEqual([
        {
          id: "order_1",
          createdAt: baseOrder.createdAt,
          status: "paid",
          totalAmount: 1000,
          currency: "USD",
          productName: "Pro Plan",
          description: "A plan",
        },
      ]);
      expect(client.customers.getExternal).toHaveBeenCalledTimes(2);
      expect(client.orders.list).toHaveBeenCalledTimes(1);
    });

    it("retries customer ID resolution on a later call after transient failures", async () => {
      const err = Object.assign(new Error("customer lookup failed"), { status: 503 });
      client.customers.getExternal
        .mockRejectedValueOnce(err)
        .mockRejectedValueOnce(err)
        .mockResolvedValueOnce({ id: "cust_1" });
      client.orders.list.mockResolvedValue({ result: { items: [] } });
      const gateway = makeGateway(client);

      await expect(gateway.listUserOrders("user_1")).rejects.toThrow(
        "customer lookup failed"
      );
      const result = await gateway.listUserOrders("user_1");

      expect(result).toEqual([]);
      expect(client.customers.getExternal).toHaveBeenCalledTimes(3);
      expect(client.orders.list).toHaveBeenCalledTimes(1);
    });

    it("retries on 5xx once then succeeds", async () => {
      client.customers.getExternal.mockResolvedValue({ id: "cust_1" });
      const err = Object.assign(new Error("bad gateway"), { status: 502 });
      client.orders.list
        .mockRejectedValueOnce(err)
        .mockResolvedValueOnce({ result: { items: [] } });

      const result = await makeGateway(client).listUserOrders("user_1");

      expect(result).toEqual([]);
      expect(client.orders.list).toHaveBeenCalledTimes(2);
    });

    it("gives up after 2 attempts on persistent 5xx", async () => {
      client.customers.getExternal.mockResolvedValue({ id: "cust_1" });
      const err = Object.assign(new Error("bad gateway"), { status: 503 });
      client.orders.list.mockRejectedValue(err);

      await expect(makeGateway(client).listUserOrders("user_1")).rejects.toThrow(
        "bad gateway"
      );
      expect(client.orders.list).toHaveBeenCalledTimes(2);
    });
  });

  describe("getCreditBalance", () => {
    it("returns meter balance when meter exists", async () => {
      client.customers.getStateExternal.mockResolvedValue({
        ...baseState,
        activeMeters: [{ meterId: "meter_a", balance: 42 }],
      });

      const result = await makeGateway(client).getCreditBalance(
        "user_1",
        "meter_a"
      );

      expect(result).toEqual({ meterId: "meter_a", balance: 42, customerId: "cust_1" });
    });

    it("returns { balance: 0 } when customer exists but meter missing", async () => {
      client.customers.getStateExternal.mockResolvedValue({
        ...baseState,
        activeMeters: [],
      });

      const result = await makeGateway(client).getCreditBalance(
        "user_1",
        "missing_meter"
      );

      expect(result).toEqual({
        meterId: "missing_meter",
        balance: 0,
        customerId: "cust_1",
      });
    });

    it("returns null when customer is not found", async () => {
      client.customers.getStateExternal.mockRejectedValue(makeNotFound());
      const result = await makeGateway(client).getCreditBalance(
        "user_1",
        "meter_a"
      );
      expect(result).toBeNull();
    });
  });

  describe("recordUsage", () => {
    it("ingests events with externalCustomerId (no customer resolve)", async () => {
      client.events.ingest.mockResolvedValue(undefined);
      await makeGateway(client).recordUsage("user_1", {
        name: "use-credit",
        metadata: { tokens: 10 },
      });
      expect(client.customers.getExternal).not.toHaveBeenCalled();
      expect(client.events.ingest).toHaveBeenCalledWith(
        expect.objectContaining({
          events: [
            expect.objectContaining({
              name: "use-credit",
              externalCustomerId: "user_1",
              metadata: { tokens: 10 },
            }),
          ],
        }),
        expect.any(Object)
      );
    });

    it("does not throw on SDK failure (fire-and-forget)", async () => {
      client.events.ingest.mockRejectedValue(new Error("boom"));
      await expect(
        makeGateway(client).recordUsage("user_1", { name: "e" })
      ).resolves.toBeUndefined();
    });

    it("does not retry on transient 5xx (mutations are never retried)", async () => {
      const err = Object.assign(new Error("5xx"), { status: 503 });
      client.events.ingest.mockRejectedValue(err);
      await makeGateway(client).recordUsage("user_1", { name: "e" });
      expect(client.events.ingest).toHaveBeenCalledTimes(1);
    });

    it("is a no-op when events array is empty", async () => {
      await makeGateway(client).recordUsage("user_1", []);
      expect(client.events.ingest).not.toHaveBeenCalled();
    });
  });

  describe("listUsageHistory", () => {
    it("propagates pagination fields unchanged and defaults currentPage from opts", async () => {
      client.customers.getExternal.mockResolvedValue({ id: "cust_1" });
      client.events.list.mockResolvedValue({
        result: {
          items: [
            {
              id: "evt_1",
              name: "use-credit",
              timestamp: new Date("2026-02-01"),
              metadata: { tokens: 5 },
            },
          ],
          pagination: { totalCount: 37, maxPage: 4 },
        },
      });

      const result = await makeGateway(client).listUsageHistory("user_1", {
        limit: 10,
        page: 2,
      });

      expect(result.pagination).toEqual({
        totalCount: 37,
        maxPage: 4,
        currentPage: 2,
      });
      expect(result.events).toHaveLength(1);
      expect(client.events.list).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: "cust_1",
          limit: 10,
          page: 2,
          source: "user",
        }),
        expect.any(Object)
      );
    });

    it("returns empty result when customer is not found", async () => {
      client.customers.getExternal.mockRejectedValue(makeNotFound());
      const result = await makeGateway(client).listUsageHistory("user_1");
      expect(result.events).toEqual([]);
      expect(result.pagination.totalCount).toBe(0);
      expect(result.pagination.currentPage).toBe(1);
    });

    it("returns usage after a missing customer lookup later resolves", async () => {
      const timestamp = new Date("2026-02-01");
      client.customers.getExternal
        .mockRejectedValueOnce(makeNotFound())
        .mockResolvedValueOnce({ id: "cust_1" });
      client.events.list.mockResolvedValue({
        result: {
          items: [
            {
              id: "evt_1",
              name: "use-credit",
              timestamp,
              metadata: { tokens: 5 },
            },
          ],
          pagination: { totalCount: 1, maxPage: 1 },
        },
      });
      const gateway = makeGateway(client);

      expect(await gateway.listUsageHistory("user_1")).toEqual({
        events: [],
        pagination: { totalCount: 0, maxPage: 1, currentPage: 1 },
      });
      const result = await gateway.listUsageHistory("user_1");

      expect(result).toEqual({
        events: [
          {
            id: "evt_1",
            name: "use-credit",
            timestamp,
            metadata: { tokens: 5 },
          },
        ],
        pagination: { totalCount: 1, maxPage: 1, currentPage: 1 },
      });
      expect(client.customers.getExternal).toHaveBeenCalledTimes(2);
      expect(client.events.list).toHaveBeenCalledTimes(1);
    });
  });

  describe("getUserCustomerState", () => {
    it("returns state on happy path", async () => {
      client.customers.getStateExternal.mockResolvedValue(baseState);
      const result = await makeGateway(client).getUserCustomerState("user_1");
      expect(result?.id).toBe("cust_1");
    });

    it("returns null on ResourceNotFound", async () => {
      client.customers.getStateExternal.mockRejectedValue(makeNotFound());
      const result = await makeGateway(client).getUserCustomerState("user_1");
      expect(result).toBeNull();
    });
  });

  describe("fetchActiveSubscriptions", () => {
    it("maps active subscriptions to PolarSubscription", async () => {
      client.customers.getStateExternal.mockResolvedValue({
        ...baseState,
        activeSubscriptions: [
          {
            id: "sub_1",
            createdAt: new Date("2026-01-01"),
            modifiedAt: null,
            status: "active",
            amount: 1000,
            currency: "USD",
            recurringInterval: "month",
            currentPeriodStart: new Date("2026-01-01"),
            currentPeriodEnd: new Date("2026-02-01"),
            trialStart: null,
            trialEnd: null,
            cancelAtPeriodEnd: false,
            canceledAt: null,
            startedAt: new Date("2026-01-01"),
            endsAt: null,
            productId: "prod_1",
            discountId: null,
          },
        ],
      });

      const result = await makeGateway(client).fetchActiveSubscriptions("user_1");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("sub_1");
      expect(result[0].status).toBe("active");
    });

    it("returns [] when customer not found", async () => {
      client.customers.getStateExternal.mockRejectedValue(makeNotFound());
      const result = await makeGateway(client).fetchActiveSubscriptions(
        "user_1"
      );
      expect(result).toEqual([]);
    });
  });

  describe("hasAnyBenefitGrant", () => {
    it("returns true when grants exist", async () => {
      client.customerSessions.create.mockResolvedValue({ token: "tok" });
      client.customerPortal.benefitGrants.list.mockResolvedValue({
        result: { items: [{ id: "g1" }] },
      });
      const result = await makeGateway(client).hasAnyBenefitGrant("user_1");
      expect(result).toBe(true);
    });

    it("returns false when there are no grants", async () => {
      client.customerSessions.create.mockResolvedValue({ token: "tok" });
      client.customerPortal.benefitGrants.list.mockResolvedValue({
        result: { items: [] },
      });
      const result = await makeGateway(client).hasAnyBenefitGrant("user_1");
      expect(result).toBe(false);
    });

    it("returns false on ResourceNotFound", async () => {
      client.customerSessions.create.mockRejectedValue(makeNotFound());
      const result = await makeGateway(client).hasAnyBenefitGrant("user_1");
      expect(result).toBe(false);
    });
  });

  describe("listDownloadables", () => {
    it("maps downloadables into domain type on happy path", async () => {
      client.customerSessions.create.mockResolvedValue({ token: "tok" });
      const expiresAt = new Date("2026-06-01");
      client.customerPortal.downloadables.list.mockResolvedValue({
        result: {
          items: [
            {
              file: {
                id: "f1",
                name: "guide.pdf",
                size: 1234,
                sizeReadable: "1.2 KB",
                download: { url: "https://dl/x", expiresAt },
              },
            },
          ],
        },
      });

      const result = await makeGateway(client).listDownloadables("user_1");

      expect(result).toEqual([
        {
          id: "f1",
          name: "guide.pdf",
          size: 1234,
          sizeReadable: "1.2 KB",
          downloadUrl: "https://dl/x",
          expiresAt,
        },
      ]);
    });

    it("returns [] on ResourceNotFound", async () => {
      client.customerSessions.create.mockRejectedValue(makeNotFound());
      const result = await makeGateway(client).listDownloadables("user_1");
      expect(result).toEqual([]);
    });
  });

  describe("listGitHubBenefits", () => {
    it("filters to github_repository benefits and maps properties", async () => {
      client.customerSessions.create.mockResolvedValue({ token: "tok" });
      const grantedAt = new Date("2026-03-01");
      client.customerPortal.benefitGrants.list.mockResolvedValue({
        result: {
          items: [
            {
              benefit: {
                id: "b1",
                type: "github_repository",
                description: "Repo access",
                properties: {
                  repositoryOwner: "acme",
                  repositoryName: "core",
                },
              },
              properties: { permission: "push" },
              isGranted: true,
              grantedAt,
            },
            {
              benefit: { id: "b2", type: "discord", properties: {} },
              properties: {},
              isGranted: true,
              grantedAt: null,
            },
          ],
        },
      });

      const result = await makeGateway(client).listGitHubBenefits("user_1");

      expect(result).toEqual([
        {
          id: "b1",
          repositoryOwner: "acme",
          repositoryName: "core",
          repositoryUrl: "https://github.com/acme/core",
          permission: "push",
          isGranted: true,
          grantedAt,
          description: "Repo access",
        },
      ]);
    });

    it("returns [] on ResourceNotFound", async () => {
      client.customerSessions.create.mockRejectedValue(makeNotFound());
      const result = await makeGateway(client).listGitHubBenefits("user_1");
      expect(result).toEqual([]);
    });
  });

  describe("deleteUserCustomer", () => {
    it("calls deleteExternal on happy path", async () => {
      client.customers.deleteExternal.mockResolvedValue(undefined);
      await makeGateway(client).deleteUserCustomer("user_1");
      expect(client.customers.deleteExternal).toHaveBeenCalledWith(
        { externalId: "user_1" },
        expect.any(Object)
      );
    });

    it("swallows ResourceNotFound (idempotent delete)", async () => {
      client.customers.deleteExternal.mockRejectedValue(makeNotFound());
      await expect(
        makeGateway(client).deleteUserCustomer("user_1")
      ).resolves.toBeUndefined();
    });
  });
});

describe("FakePolarGateway", () => {
  it("implements the full port with seedable customers", async () => {
    const { createFakePolarGateway } = await import("./fake-polar-gateway");
    const fake = createFakePolarGateway();
    fake.seedCustomer({
      userId: "u1",
      customerId: "c1",
      orders: [
        {
          id: "o1",
          createdAt: new Date("2026-01-01"),
          status: "paid",
          totalAmount: 100,
          currency: "USD",
          productName: "X",
          description: "Y",
        },
      ],
      meters: [{ meterId: "m", balance: 7 }],
      benefitGrants: 1,
    });

    expect((await fake.listUserOrders("u1")).length).toBe(1);
    expect(await fake.getCreditBalance("u1", "m")).toEqual({
      meterId: "m",
      balance: 7,
      customerId: "c1",
    });
    expect(await fake.hasAnyBenefitGrant("u1")).toBe(true);
    expect(await fake.listUserOrders("ghost")).toEqual([]);
    expect(await fake.hasAnyBenefitGrant("ghost")).toBe(false);

    await fake.recordUsage("u1", { name: "evt" });
    expect(fake.getRecordedEvents("u1")).toHaveLength(1);

    await fake.deleteUserCustomer("u1");
    expect(await fake.getCreditBalance("u1", "m")).toBeNull();
  });
});
