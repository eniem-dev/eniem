import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loadPolarCredentials,
  createPolarClient,
  productToPolarCreate,
  productToPolarUpdate,
  createPolarProduct,
  updatePolarProduct,
  archivePolarProduct,
  checkProductExists,
  _parseEnvContent,
  type PolarCredentials,
} from "../polar.js";
import type { Product } from "../products.js";

// Mock fs/promises
vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
}));

// Create mock functions that can be controlled per test
const mockProductsCreate = vi.fn();
const mockProductsGet = vi.fn();
const mockProductsUpdate = vi.fn();

// Mock @polar-sh/sdk with a proper class constructor
vi.mock("@polar-sh/sdk", () => {
  return {
    Polar: class MockPolar {
      products = { create: mockProductsCreate, get: mockProductsGet, update: mockProductsUpdate };
      constructor(public options: { accessToken: string; server: string }) {
        // Store options for test assertions
      }
    },
  };
});

import { readFile } from "fs/promises";
import { Polar } from "@polar-sh/sdk";

const mockReadFile = vi.mocked(readFile);

// Test fixtures
const validProduct: Product = {
  slug: "pro-monthly",
  name: "Pro Monthly",
  description: "Full access to all Pro features",
  type: "subscription",
  recurringInterval: "month",
  prices: [
    {
      amountType: "fixed",
      amount: 1900,
      currency: "usd",
    },
  ],
  display: {
    title: "Pro",
    subtitle: "Billed monthly",
    badge: null,
    features: ["Unlimited projects", "Priority support", "API access"],
    highlighted: false,
    cta: "Get Started",
  },
  polarProductId: null,
};

const validCredentials: PolarCredentials = {
  accessToken: "polar_test_token_123",
};

describe("polar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProductsCreate.mockReset();
    mockProductsGet.mockReset();
    mockProductsUpdate.mockReset();
  });

  describe("_parseEnvContent", () => {
    it("parses basic key=value pairs", () => {
      const content = "KEY=value\nANOTHER=test";
      const result = _parseEnvContent(content);
      expect(result).toEqual({
        KEY: "value",
        ANOTHER: "test",
      });
    });

    it("ignores comments", () => {
      const content = "# This is a comment\nKEY=value\n# Another comment";
      const result = _parseEnvContent(content);
      expect(result).toEqual({ KEY: "value" });
    });

    it("ignores empty lines", () => {
      const content = "KEY=value\n\n\nANOTHER=test";
      const result = _parseEnvContent(content);
      expect(result).toEqual({
        KEY: "value",
        ANOTHER: "test",
      });
    });

    it("removes surrounding double quotes", () => {
      const content = 'KEY="quoted value"';
      const result = _parseEnvContent(content);
      expect(result).toEqual({ KEY: "quoted value" });
    });

    it("removes surrounding single quotes", () => {
      const content = "KEY='quoted value'";
      const result = _parseEnvContent(content);
      expect(result).toEqual({ KEY: "quoted value" });
    });

    it("handles values with equals signs", () => {
      const content = "KEY=value=with=equals";
      const result = _parseEnvContent(content);
      expect(result).toEqual({ KEY: "value=with=equals" });
    });

    it("trims whitespace around keys and values", () => {
      const content = "  KEY  =  value  ";
      const result = _parseEnvContent(content);
      expect(result).toEqual({ KEY: "value" });
    });
  });

  describe("loadPolarCredentials", () => {
    it("returns credentials when .env has valid access token", async () => {
      const envContent = `
POLAR_ACCESS_TOKEN=polar_test_token
`;
      mockReadFile.mockResolvedValue(envContent);

      const result = await loadPolarCredentials("/project");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.credentials.accessToken).toBe("polar_test_token");
      }
    });

    it("returns missing fields when access token is placeholder", async () => {
      const envContent = `
POLAR_ACCESS_TOKEN=polar_xx
`;
      mockReadFile.mockResolvedValue(envContent);

      const result = await loadPolarCredentials("/project");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.missingFields).toContain("accessToken");
      }
    });

    it("returns missing fields when .env file does not exist", async () => {
      const error = new Error("ENOENT") as NodeJS.ErrnoException;
      error.code = "ENOENT";
      mockReadFile.mockRejectedValue(error);

      const result = await loadPolarCredentials("/project");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.missingFields).toContain("accessToken");
      }
    });

    it("returns missing fields when access token is empty", async () => {
      const envContent = `
POLAR_ACCESS_TOKEN=
`;
      mockReadFile.mockResolvedValue(envContent);

      const result = await loadPolarCredentials("/project");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.missingFields).toContain("accessToken");
      }
    });
  });

  describe("createPolarClient", () => {
    it("creates client with sandbox environment", () => {
      const client = createPolarClient("token123", "sandbox");

      expect(client).toBeInstanceOf(Polar);
      // The mock class stores options, so we can access them
      expect((client as unknown as { options: { accessToken: string; server: string } }).options).toEqual({
        accessToken: "token123",
        server: "sandbox",
      });
    });

    it("creates client with production environment", () => {
      const client = createPolarClient("token123", "production");

      expect(client).toBeInstanceOf(Polar);
      expect((client as unknown as { options: { accessToken: string; server: string } }).options).toEqual({
        accessToken: "token123",
        server: "production",
      });
    });
  });

  describe("productToPolarCreate", () => {
    it("converts subscription product with fixed price", () => {
      const result = productToPolarCreate(validProduct);

      expect(result.name).toBe("Pro Monthly");
      expect(result.description).toBe("Full access to all Pro features");
      expect(result.recurringInterval).toBe("month");
      expect(result.prices).toEqual([
        {
          amountType: "fixed",
          priceAmount: 1900,
          priceCurrency: "usd",
        },
      ]);
      expect(result.metadata).toEqual({
        slug: "pro-monthly",
        source: "eniem-cli",
      });
    });

    it("converts one_time product (no recurring interval)", () => {
      const oneTimeProduct: Product = {
        ...validProduct,
        type: "one_time",
        recurringInterval: undefined,
      };

      const result = productToPolarCreate(oneTimeProduct);

      expect(result.recurringInterval).toBeNull();
    });

    it("converts free product", () => {
      const freeProduct: Product = {
        ...validProduct,
        type: "free",
        prices: [{ amountType: "free" }],
      };

      const result = productToPolarCreate(freeProduct);

      expect(result.prices).toEqual([{ amountType: "free" }]);
    });

    it("converts custom price product", () => {
      const customProduct: Product = {
        ...validProduct,
        prices: [
          {
            amountType: "custom",
            amount: 500,
            currency: "usd",
          },
        ],
      };

      const result = productToPolarCreate(customProduct);

      expect(result.prices).toEqual([
        {
          amountType: "custom",
          priceCurrency: "usd",
          minimumAmount: 500,
          presetAmount: 500,
        },
      ]);
    });

    it("converts yearly subscription", () => {
      const yearlyProduct: Product = {
        ...validProduct,
        recurringInterval: "year",
      };

      const result = productToPolarCreate(yearlyProduct);

      expect(result.recurringInterval).toBe("year");
    });

    it("converts weekly subscription to monthly (Polar limitation)", () => {
      const weeklyProduct: Product = {
        ...validProduct,
        recurringInterval: "week",
      };

      const result = productToPolarCreate(weeklyProduct);

      expect(result.recurringInterval).toBe("month");
    });

    it("converts daily subscription to monthly (Polar limitation)", () => {
      const dailyProduct: Product = {
        ...validProduct,
        recurringInterval: "day",
      };

      const result = productToPolarCreate(dailyProduct);

      expect(result.recurringInterval).toBe("month");
    });

    it("handles missing description", () => {
      const noDescProduct: Product = {
        ...validProduct,
        description: undefined,
      };

      const result = productToPolarCreate(noDescProduct);

      expect(result.description).toBeNull();
    });
  });

  describe("createPolarProduct", () => {
    it("returns polarProductId on success", async () => {
      mockProductsCreate.mockResolvedValue({ id: "pol_abc123" });

      const result = await createPolarProduct(
        validCredentials,
        validProduct,
        "sandbox"
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.polarProductId).toBe("pol_abc123");
      }
    });

    it("returns error on 401 unauthorized", async () => {
      mockProductsCreate.mockRejectedValue(new Error("401 Unauthorized"));

      const result = await createPolarProduct(
        validCredentials,
        validProduct,
        "sandbox"
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid Polar access token");
      }
    });

    it("returns error on 403 forbidden", async () => {
      mockProductsCreate.mockRejectedValue(new Error("403 Forbidden"));

      const result = await createPolarProduct(
        validCredentials,
        validProduct,
        "sandbox"
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Access denied");
      }
    });

    it("returns error on 404 not found", async () => {
      mockProductsCreate.mockRejectedValue(new Error("404 Not Found"));

      const result = await createPolarProduct(
        validCredentials,
        validProduct,
        "sandbox"
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Organization not found");
      }
    });

    it("returns error on validation failure", async () => {
      mockProductsCreate.mockRejectedValue(
        new Error("422 validation error: name required")
      );

      const result = await createPolarProduct(
        validCredentials,
        validProduct,
        "sandbox"
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Validation error");
      }
    });

    it("returns generic error for unknown failures", async () => {
      mockProductsCreate.mockRejectedValue(
        new Error("Network connection failed")
      );

      const result = await createPolarProduct(
        validCredentials,
        validProduct,
        "sandbox"
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Failed to create product on Polar");
        expect(result.error).toContain("Network connection failed");
      }
    });

    it("calls create with correct product data", async () => {
      mockProductsCreate.mockResolvedValue({ id: "pol_test_123" });

      await createPolarProduct(validCredentials, validProduct, "sandbox");

      expect(mockProductsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Pro Monthly",
          description: "Full access to all Pro features",
          recurringInterval: "month",
          prices: [
            {
              amountType: "fixed",
              priceAmount: 1900,
              priceCurrency: "usd",
            },
          ],
        })
      );
    });
  });

  describe("checkProductExists", () => {
    it("returns exists: true when product exists", async () => {
      mockProductsGet.mockResolvedValue({ id: "pol_abc123", name: "Pro" });

      const result = await checkProductExists(
        validCredentials,
        "pol_abc123",
        "sandbox"
      );

      expect(result.exists).toBe(true);
      expect(mockProductsGet).toHaveBeenCalledWith({ id: "pol_abc123" });
    });

    it("returns exists: false when product not found (404)", async () => {
      mockProductsGet.mockRejectedValue(new Error("404 Not Found"));

      const result = await checkProductExists(
        validCredentials,
        "pol_nonexistent",
        "sandbox"
      );

      expect(result.exists).toBe(false);
      expect("error" in result).toBe(false);
    });

    it("returns exists: false with error on network failure", async () => {
      mockProductsGet.mockRejectedValue(new Error("Network connection failed"));

      const result = await checkProductExists(
        validCredentials,
        "pol_abc123",
        "sandbox"
      );

      expect(result.exists).toBe(false);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Failed to verify product existence");
        expect(result.error).toContain("Network connection failed");
      }
    });

    it("returns exists: false with error on 401 unauthorized", async () => {
      mockProductsGet.mockRejectedValue(new Error("401 Unauthorized"));

      const result = await checkProductExists(
        validCredentials,
        "pol_abc123",
        "sandbox"
      );

      expect(result.exists).toBe(false);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Failed to verify product existence");
      }
    });

    it("uses correct environment when checking", async () => {
      mockProductsGet.mockResolvedValue({ id: "pol_prod123", name: "Pro" });

      await checkProductExists(validCredentials, "pol_prod123", "production");

      expect(mockProductsGet).toHaveBeenCalledWith({ id: "pol_prod123" });
    });
  });

  describe("productToPolarUpdate", () => {
    it("maps product name and description", () => {
      const result = productToPolarUpdate(validProduct);

      expect(result.name).toBe("Pro Monthly");
      expect(result.description).toBe("Full access to all Pro features");
    });

    it("includes metadata with slug and source", () => {
      const result = productToPolarUpdate(validProduct);

      expect(result.metadata).toEqual({
        slug: "pro-monthly",
        source: "eniem-cli",
      });
    });

    it("handles missing description as null", () => {
      const noDescProduct: Product = {
        ...validProduct,
        description: undefined,
      };

      const result = productToPolarUpdate(noDescProduct);

      expect(result.description).toBeNull();
    });
  });

  describe("updatePolarProduct", () => {
    it("returns success: true when update succeeds", async () => {
      mockProductsUpdate.mockResolvedValue({ id: "pol_abc123", name: "Pro Monthly" });

      const result = await updatePolarProduct(
        validCredentials,
        "pol_abc123",
        validProduct,
        "sandbox"
      );

      expect(result.success).toBe(true);
    });

    it("calls update with correct product id and data", async () => {
      mockProductsUpdate.mockResolvedValue({ id: "pol_abc123", name: "Pro Monthly" });

      await updatePolarProduct(
        validCredentials,
        "pol_abc123",
        validProduct,
        "sandbox"
      );

      expect(mockProductsUpdate).toHaveBeenCalledWith({
        id: "pol_abc123",
        productUpdate: expect.objectContaining({
          name: "Pro Monthly",
          description: "Full access to all Pro features",
          metadata: {
            slug: "pro-monthly",
            source: "eniem-cli",
          },
        }),
      });
    });

    it("returns error on 401 unauthorized", async () => {
      mockProductsUpdate.mockRejectedValue(new Error("401 Unauthorized"));

      const result = await updatePolarProduct(
        validCredentials,
        "pol_abc123",
        validProduct,
        "sandbox"
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid Polar access token");
      }
    });

    it("returns error on 403 forbidden", async () => {
      mockProductsUpdate.mockRejectedValue(new Error("403 Forbidden"));

      const result = await updatePolarProduct(
        validCredentials,
        "pol_abc123",
        validProduct,
        "sandbox"
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Access denied");
      }
    });

    it("returns error on 404 not found", async () => {
      mockProductsUpdate.mockRejectedValue(new Error("404 Not Found"));

      const result = await updatePolarProduct(
        validCredentials,
        "pol_abc123",
        validProduct,
        "sandbox"
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Product not found");
      }
    });

    it("returns error on validation failure", async () => {
      mockProductsUpdate.mockRejectedValue(
        new Error("422 validation error: name required")
      );

      const result = await updatePolarProduct(
        validCredentials,
        "pol_abc123",
        validProduct,
        "sandbox"
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Validation error");
      }
    });

    it("returns generic error for unknown failures", async () => {
      mockProductsUpdate.mockRejectedValue(
        new Error("Network connection failed")
      );

      const result = await updatePolarProduct(
        validCredentials,
        "pol_abc123",
        validProduct,
        "sandbox"
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Failed to update product on Polar");
        expect(result.error).toContain("Network connection failed");
      }
    });
  });

  describe("archivePolarProduct", () => {
    it("returns success: true when archive succeeds", async () => {
      mockProductsUpdate.mockResolvedValue({ id: "pol_abc123", isArchived: true });

      const result = await archivePolarProduct(
        validCredentials,
        "pol_abc123",
        "sandbox"
      );

      expect(result.success).toBe(true);
    });

    it("calls update with isArchived: true", async () => {
      mockProductsUpdate.mockResolvedValue({ id: "pol_abc123", isArchived: true });

      await archivePolarProduct(validCredentials, "pol_abc123", "sandbox");

      expect(mockProductsUpdate).toHaveBeenCalledWith({
        id: "pol_abc123",
        productUpdate: { isArchived: true },
      });
    });

    it("returns error on 401 unauthorized", async () => {
      mockProductsUpdate.mockRejectedValue(new Error("401 Unauthorized"));

      const result = await archivePolarProduct(
        validCredentials,
        "pol_abc123",
        "sandbox"
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid Polar access token");
      }
    });

    it("returns error on 403 forbidden", async () => {
      mockProductsUpdate.mockRejectedValue(new Error("403 Forbidden"));

      const result = await archivePolarProduct(
        validCredentials,
        "pol_abc123",
        "sandbox"
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Access denied");
      }
    });

    it("returns error on 404 not found", async () => {
      mockProductsUpdate.mockRejectedValue(new Error("404 Not Found"));

      const result = await archivePolarProduct(
        validCredentials,
        "pol_abc123",
        "sandbox"
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Product not found");
      }
    });

    it("returns generic error for unknown failures", async () => {
      mockProductsUpdate.mockRejectedValue(
        new Error("Network connection failed")
      );

      const result = await archivePolarProduct(
        validCredentials,
        "pol_abc123",
        "sandbox"
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Failed to archive product on Polar");
        expect(result.error).toContain("Network connection failed");
      }
    });

    it("uses correct environment when archiving", async () => {
      mockProductsUpdate.mockResolvedValue({ id: "pol_prod123", isArchived: true });

      await archivePolarProduct(validCredentials, "pol_prod123", "production");

      expect(mockProductsUpdate).toHaveBeenCalledWith({
        id: "pol_prod123",
        productUpdate: { isArchived: true },
      });
    });
  });
});
