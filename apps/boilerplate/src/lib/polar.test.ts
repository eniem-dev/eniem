import { describe, it, expect, vi } from "vitest";

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
      polarAccessToken: "test-token",
      polarServer: "sandbox",
    },
  },
}));

describe("polarClient", () => {
  it("instantiates Polar with config from env", async () => {
    const { polarClient } = await import("./polar");
    expect(polarClient).toBeDefined();
    expect(mockPolarConstructor).toHaveBeenCalledWith({
      accessToken: "test-token",
      server: "sandbox",
    });
  });
});
