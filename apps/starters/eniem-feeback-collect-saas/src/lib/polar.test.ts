import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPolarConstructor = vi.fn();

vi.mock("@polar-sh/sdk", () => ({
  Polar: class MockPolar {
    constructor(...args: unknown[]) {
      mockPolarConstructor(...args);
      return { customers: { list: vi.fn() }, _mock: true };
    }
  },
}));

vi.mock("@/config", () => ({
  env: {
    payment: {
      polarAccessToken: undefined as string | undefined,
      polarServer: "sandbox",
    },
  },
}));

// Access the mocked env so tests can mutate it
import { env } from "@/config";
const paymentEnv = env.payment as { polarAccessToken: string | undefined };

describe("polarClient lazy Proxy", () => {
  beforeEach(() => {
    vi.resetModules();
    mockPolarConstructor.mockClear();
  });

  it("importing polar.ts without POLAR_ACCESS_TOKEN does NOT throw", async () => {
    paymentEnv.polarAccessToken = undefined;
    // Re-import to get a fresh module with the proxy
    const mod = await import("./polar");
    expect(mod.polarClient).toBeDefined();
    // Constructor should NOT have been called at import time
    expect(mockPolarConstructor).not.toHaveBeenCalled();
  });

  it("accessing a property without POLAR_ACCESS_TOKEN throws", async () => {
    paymentEnv.polarAccessToken = undefined;
    const { polarClient } = await import("./polar");
    expect(() => polarClient.customers).toThrow("POLAR_ACCESS_TOKEN is required");
  });

  it("with POLAR_ACCESS_TOKEN set, property access works and instantiates Polar", async () => {
    paymentEnv.polarAccessToken = "test-token";
    const { polarClient } = await import("./polar");
    // Access a property — this triggers lazy init
    const customers = polarClient.customers;
    expect(customers).toBeDefined();
    expect(mockPolarConstructor).toHaveBeenCalledWith({
      accessToken: "test-token",
      server: "sandbox",
    });
  });

  it("only creates one Polar instance across multiple accesses", async () => {
    paymentEnv.polarAccessToken = "test-token";
    const { polarClient } = await import("./polar");
    void polarClient.customers;
    void polarClient.customers;
    void polarClient.customers;
    // Constructor should have been called only once
    expect(mockPolarConstructor).toHaveBeenCalledTimes(1);
  });
});
