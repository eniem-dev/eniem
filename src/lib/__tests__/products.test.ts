import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  slugSchema,
  productSchema,
  productSchemaWithValidation,
  toKebabCase,
  slugExists,
  validateSlug,
  validateProduct,
  readProductsFile,
  writeProductsFile,
  dollarsToCents,
  validatePrice,
  generateYearlySlug,
  generateYearlyTitle,
  calculateYearlyPrice,
  type Product,
} from "../products.js";

// Mock fs/promises
vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

import { readFile, writeFile } from "fs/promises";

const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);

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
      priceAmount: 1900,
      priceCurrency: "usd",
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

describe("products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("slugSchema", () => {
    it("accepts valid kebab-case slugs", () => {
      expect(slugSchema.safeParse("my-product").success).toBe(true);
      expect(slugSchema.safeParse("product").success).toBe(true);
      expect(slugSchema.safeParse("pro-monthly").success).toBe(true);
      expect(slugSchema.safeParse("plan1").success).toBe(true);
      expect(slugSchema.safeParse("my-cool-plan-123").success).toBe(true);
    });

    it("rejects empty strings", () => {
      const result = slugSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("rejects slugs starting with numbers", () => {
      const result = slugSchema.safeParse("123-product");
      expect(result.success).toBe(false);
    });

    it("rejects slugs with uppercase letters", () => {
      const result = slugSchema.safeParse("MyProduct");
      expect(result.success).toBe(false);
    });

    it("rejects slugs with underscores", () => {
      const result = slugSchema.safeParse("my_product");
      expect(result.success).toBe(false);
    });

    it("rejects slugs with consecutive hyphens", () => {
      const result = slugSchema.safeParse("my--product");
      expect(result.success).toBe(false);
    });

    it("rejects slugs ending with hyphen", () => {
      const result = slugSchema.safeParse("my-product-");
      expect(result.success).toBe(false);
    });

    it("rejects slugs starting with hyphen", () => {
      const result = slugSchema.safeParse("-my-product");
      expect(result.success).toBe(false);
    });

    it("rejects slugs longer than 99 characters", () => {
      const longSlug = "a" + "-bcd".repeat(30);
      const result = slugSchema.safeParse(longSlug);
      expect(result.success).toBe(false);
    });
  });

  describe("productSchema", () => {
    it("accepts valid products", () => {
      const result = productSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it("rejects products with empty name", () => {
      const product = { ...validProduct, name: "" };
      const result = productSchema.safeParse(product);
      expect(result.success).toBe(false);
    });

    it("rejects products with name over 99 chars", () => {
      const product = { ...validProduct, name: "a".repeat(100) };
      const result = productSchema.safeParse(product);
      expect(result.success).toBe(false);
    });

    it("rejects products with description over 200 chars", () => {
      const product = { ...validProduct, description: "a".repeat(201) };
      const result = productSchema.safeParse(product);
      expect(result.success).toBe(false);
    });

    it("accepts products with optional fields missing", () => {
      const product = {
        slug: "basic",
        name: "Basic",
        type: "free" as const,
        prices: [{ amountType: "free" as const }],
        display: {
          title: "Basic",
          badge: null,
          features: [],
          highlighted: false,
          cta: "Start Free",
        },
      };
      const result = productSchema.safeParse(product);
      expect(result.success).toBe(true);
    });

    it("accepts one_time products", () => {
      const product = {
        ...validProduct,
        type: "one_time" as const,
        recurringInterval: undefined,
      };
      const result = productSchema.safeParse(product);
      expect(result.success).toBe(true);
    });

    it("accepts free products", () => {
      const product = {
        ...validProduct,
        type: "free" as const,
        recurringInterval: undefined,
        prices: [{ amountType: "free" as const }],
      };
      const result = productSchema.safeParse(product);
      expect(result.success).toBe(true);
    });
  });

  describe("productSchemaWithValidation", () => {
    it("requires recurringInterval for subscription products", () => {
      const product = {
        ...validProduct,
        type: "subscription" as const,
        recurringInterval: undefined,
      };
      const result = productSchemaWithValidation.safeParse(product);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("Recurring interval");
      }
    });

    it("allows missing recurringInterval for one_time products", () => {
      const product = {
        ...validProduct,
        type: "one_time" as const,
        recurringInterval: undefined,
      };
      const result = productSchemaWithValidation.safeParse(product);
      expect(result.success).toBe(true);
    });

    it("allows missing recurringInterval for free products", () => {
      const product = {
        ...validProduct,
        type: "free" as const,
        recurringInterval: undefined,
        prices: [{ amountType: "free" as const }],
      };
      const result = productSchemaWithValidation.safeParse(product);
      expect(result.success).toBe(true);
    });
  });

  describe("toKebabCase", () => {
    it("converts spaces to hyphens", () => {
      expect(toKebabCase("My Product")).toBe("my-product");
    });

    it("converts to lowercase", () => {
      expect(toKebabCase("MyProduct")).toBe("myproduct");
    });

    it("handles mixed case with spaces", () => {
      expect(toKebabCase("Pro Monthly Plan")).toBe("pro-monthly-plan");
    });

    it("removes special characters", () => {
      expect(toKebabCase("Pro! Plan #1")).toBe("pro-plan-1");
    });

    it("removes leading and trailing hyphens", () => {
      expect(toKebabCase("-Pro Plan-")).toBe("pro-plan");
    });

    it("collapses multiple hyphens", () => {
      expect(toKebabCase("Pro   Plan")).toBe("pro-plan");
    });

    it("handles already kebab-case", () => {
      expect(toKebabCase("pro-monthly")).toBe("pro-monthly");
    });
  });

  describe("slugExists", () => {
    const products: Product[] = [validProduct];

    it("returns true when slug exists", () => {
      expect(slugExists(products, "pro-monthly")).toBe(true);
    });

    it("returns false when slug does not exist", () => {
      expect(slugExists(products, "basic")).toBe(false);
    });

    it("returns false for empty array", () => {
      expect(slugExists([], "pro-monthly")).toBe(false);
    });
  });

  describe("validateSlug", () => {
    it("returns success for valid slug", () => {
      const result = validateSlug("pro-monthly");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("pro-monthly");
      }
    });

    it("returns error for invalid slug", () => {
      const result = validateSlug("Pro Monthly");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe("validateProduct", () => {
    it("returns success for valid product", () => {
      const result = validateProduct(validProduct);
      expect(result.success).toBe(true);
    });

    it("returns error for invalid product", () => {
      const result = validateProduct({ ...validProduct, name: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("validates subscription requires recurringInterval", () => {
      const product = {
        ...validProduct,
        type: "subscription",
        recurringInterval: undefined,
      };
      const result = validateProduct(product);
      expect(result.success).toBe(false);
    });
  });

  describe("readProductsFile", () => {
    it("reads and parses valid products file", async () => {
      mockReadFile.mockResolvedValue(JSON.stringify([validProduct]));

      const result = await readProductsFile("/project", "sandbox");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.products).toHaveLength(1);
        expect(result.products[0]?.slug).toBe("pro-monthly");
      }
    });

    it("returns error for missing file", async () => {
      const error = new Error("ENOENT") as NodeJS.ErrnoException;
      error.code = "ENOENT";
      mockReadFile.mockRejectedValue(error);

      const result = await readProductsFile("/project", "sandbox");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });

    it("returns error for invalid JSON", async () => {
      mockReadFile.mockResolvedValue("{ invalid json }");

      const result = await readProductsFile("/project", "sandbox");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("invalid JSON");
      }
    });

    it("returns error for non-array JSON", async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ not: "array" }));

      const result = await readProductsFile("/project", "sandbox");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("must contain an array");
      }
    });

    it("returns error for invalid product in array", async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify([{ invalid: "product" }])
      );

      const result = await readProductsFile("/project", "sandbox");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid product at index 0");
      }
    });

    it("reads empty products array", async () => {
      mockReadFile.mockResolvedValue("[]");

      const result = await readProductsFile("/project", "sandbox");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.products).toHaveLength(0);
      }
    });
  });

  describe("writeProductsFile", () => {
    it("writes products to file", async () => {
      mockWriteFile.mockResolvedValue(undefined);

      const result = await writeProductsFile("/project", "sandbox", [
        validProduct,
      ]);

      expect(result.success).toBe(true);
      expect(result.path).toBe("/project/products.sandbox.json");
      expect(mockWriteFile).toHaveBeenCalledWith(
        "/project/products.sandbox.json",
        expect.stringContaining('"slug": "pro-monthly"'),
        "utf-8"
      );
    });

    it("returns error on write failure", async () => {
      mockWriteFile.mockRejectedValue(new Error("Permission denied"));

      const result = await writeProductsFile("/project", "sandbox", [
        validProduct,
      ]);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to write");
    });

    it("handles production environment", async () => {
      mockWriteFile.mockResolvedValue(undefined);

      const result = await writeProductsFile("/project", "production", [
        validProduct,
      ]);

      expect(result.path).toBe("/project/products.production.json");
    });
  });

  describe("dollarsToCents", () => {
    it("converts whole dollars", () => {
      expect(dollarsToCents("19")).toBe(1900);
      expect(dollarsToCents(19)).toBe(1900);
    });

    it("converts dollars with cents", () => {
      expect(dollarsToCents("19.99")).toBe(1999);
      expect(dollarsToCents(19.99)).toBe(1999);
    });

    it("converts cents only", () => {
      expect(dollarsToCents("0.50")).toBe(50);
      expect(dollarsToCents(0.5)).toBe(50);
    });

    it("handles zero", () => {
      expect(dollarsToCents("0")).toBe(0);
      expect(dollarsToCents(0)).toBe(0);
    });

    it("rounds to nearest cent", () => {
      expect(dollarsToCents("19.999")).toBe(2000);
      expect(dollarsToCents("19.001")).toBe(1900);
    });
  });

  describe("validatePrice", () => {
    it("accepts prices at minimum (50 cents)", () => {
      const result = validatePrice(50);
      expect(result.success).toBe(true);
    });

    it("accepts prices above minimum", () => {
      const result = validatePrice(1900);
      expect(result.success).toBe(true);
    });

    it("rejects prices below minimum", () => {
      const result = validatePrice(49);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("at least $0.50");
      }
    });
  });

  describe("generateYearlySlug", () => {
    it("replaces -monthly with -yearly", () => {
      expect(generateYearlySlug("pro-monthly")).toBe("pro-yearly");
    });

    it("appends -yearly to non-monthly slugs", () => {
      expect(generateYearlySlug("pro")).toBe("pro-yearly");
    });

    it("handles multi-word slugs", () => {
      expect(generateYearlySlug("pro-plan-monthly")).toBe("pro-plan-yearly");
    });
  });

  describe("generateYearlyTitle", () => {
    it("appends Yearly to title", () => {
      expect(generateYearlyTitle("Pro")).toBe("Pro Yearly");
    });

    it("handles multi-word titles", () => {
      expect(generateYearlyTitle("Pro Plan")).toBe("Pro Plan Yearly");
    });
  });

  describe("calculateYearlyPrice", () => {
    it("calculates 10x monthly price", () => {
      expect(calculateYearlyPrice(1900)).toBe(19000);
    });

    it("handles small amounts", () => {
      expect(calculateYearlyPrice(100)).toBe(1000);
    });
  });
});
