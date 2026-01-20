import { describe, it, expect } from "vitest";
import { productConfigSchema, type ProductConfig } from "../products.schema";

describe("products.schema", () => {
  describe("productConfigSchema", () => {
    it("should accept valid subscription product with fixed price", () => {
      const config: ProductConfig = {
        products: [
          {
            slug: "pro-monthly",
            name: "Pro Monthly",
            type: "subscription",
            recurringInterval: "month",
            prices: [{ amountType: "fixed", amount: 1900, currency: "usd" }],
            display: {
              title: "Pro",
              badge: null,
              features: ["Feature 1"],
              highlighted: false,
              cta: "Get Started",
            },
          },
        ],
      };

      const result = productConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("should accept valid one-time product", () => {
      const config: ProductConfig = {
        products: [
          {
            slug: "lifetime",
            name: "Lifetime Access",
            type: "one_time",
            prices: [{ amountType: "fixed", amount: 29900, currency: "usd" }],
            display: {
              title: "Lifetime",
              badge: "Best Deal",
              features: ["Forever access"],
              highlighted: true,
              cta: "Buy Now",
            },
          },
        ],
      };

      const result = productConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("should accept valid free product", () => {
      const config: ProductConfig = {
        products: [
          {
            slug: "free-tier",
            name: "Free Tier",
            type: "free",
            prices: [{ amountType: "free" }],
            display: {
              title: "Free",
              badge: null,
              features: ["Basic features"],
              highlighted: false,
              cta: "Start Free",
            },
          },
        ],
      };

      const result = productConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("should accept valid custom price (pay-what-you-want)", () => {
      const config: ProductConfig = {
        products: [
          {
            slug: "supporter",
            name: "Supporter",
            type: "subscription",
            recurringInterval: "month",
            prices: [
              {
                amountType: "custom",
                minimumAmount: 500,
                maximumAmount: 10000,
                presetAmount: 1000,
                currency: "usd",
              },
            ],
            display: {
              title: "Supporter",
              badge: null,
              features: ["Support us"],
              highlighted: false,
              cta: "Support Now",
            },
          },
        ],
      };

      const result = productConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("should reject duplicate slugs", () => {
      const config = {
        products: [
          {
            slug: "pro-monthly",
            name: "Pro Monthly",
            type: "subscription",
            recurringInterval: "month",
            prices: [{ amountType: "fixed", amount: 1900, currency: "usd" }],
            display: {
              title: "Pro",
              badge: null,
              features: [],
              highlighted: false,
              cta: "Get Started",
            },
          },
          {
            slug: "pro-monthly", // Duplicate slug
            name: "Another Pro",
            type: "subscription",
            recurringInterval: "month",
            prices: [{ amountType: "fixed", amount: 2900, currency: "usd" }],
            display: {
              title: "Another",
              badge: null,
              features: [],
              highlighted: false,
              cta: "Get Started",
            },
          },
        ],
      };

      const result = productConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Check that one of the error messages contains "Duplicate"
        const hasduplicateError = result.error.issues.some((issue) =>
          issue.message.toLowerCase().includes("duplicate")
        );
        expect(hasduplicateError).toBe(true);
      }
    });

    it("should reject price amount below 50 cents for fixed price", () => {
      const config = {
        products: [
          {
            slug: "cheap",
            name: "Too Cheap",
            type: "one_time",
            prices: [{ amountType: "fixed", amount: 49, currency: "usd" }], // Below minimum
            display: {
              title: "Cheap",
              badge: null,
              features: [],
              highlighted: false,
              cta: "Buy",
            },
          },
        ],
      };

      const result = productConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("should reject subscription without recurringInterval", () => {
      const config = {
        products: [
          {
            slug: "sub-no-interval",
            name: "Bad Subscription",
            type: "subscription",
            // Missing recurringInterval
            prices: [{ amountType: "fixed", amount: 1900, currency: "usd" }],
            display: {
              title: "Bad",
              badge: null,
              features: [],
              highlighted: false,
              cta: "Get",
            },
          },
        ],
      };

      const result = productConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("should reject invalid slug format", () => {
      const config = {
        products: [
          {
            slug: "Invalid Slug!", // Contains invalid characters
            name: "Product",
            type: "one_time",
            prices: [{ amountType: "fixed", amount: 1000, currency: "usd" }],
            display: {
              title: "Product",
              badge: null,
              features: [],
              highlighted: false,
              cta: "Buy",
            },
          },
        ],
      };

      const result = productConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("should reject missing required display fields", () => {
      const config = {
        products: [
          {
            slug: "incomplete",
            name: "Incomplete",
            type: "one_time",
            prices: [{ amountType: "fixed", amount: 1000, currency: "usd" }],
            display: {
              // Missing title
              badge: null,
              features: [],
              highlighted: false,
              cta: "Buy",
            },
          },
        ],
      };

      const result = productConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("should accept empty products array", () => {
      const config: ProductConfig = {
        products: [],
      };

      const result = productConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("should accept product with polarProductId", () => {
      const config: ProductConfig = {
        products: [
          {
            slug: "synced",
            name: "Synced Product",
            type: "one_time",
            prices: [{ amountType: "fixed", amount: 1000, currency: "usd" }],
            display: {
              title: "Synced",
              badge: null,
              features: [],
              highlighted: false,
              cta: "Buy",
            },
            polarProductId: "4d5c4e71-2041-496b-b8cc-f72443e34f48",
          },
        ],
      };

      const result = productConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("should accept all recurring intervals", () => {
      const intervals = ["day", "week", "month", "year"] as const;

      for (const interval of intervals) {
        const config: ProductConfig = {
          products: [
            {
              slug: `sub-${interval}`,
              name: `Subscription ${interval}`,
              type: "subscription",
              recurringInterval: interval,
              prices: [{ amountType: "fixed", amount: 1000, currency: "usd" }],
              display: {
                title: "Sub",
                badge: null,
                features: [],
                highlighted: false,
                cta: "Get",
              },
            },
          ],
        };

        const result = productConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
      }
    });
  });
});

describe("getProducts helper", () => {
  it("should return sandbox products for sandbox env", async () => {
    const { getProducts, sandboxProducts } = await import(
      "../../src/features/subscription/products.generated"
    );

    const products = getProducts("sandbox");
    expect(products).toBe(sandboxProducts);
  });

  it("should return production products for production env", async () => {
    const { getProducts, productionProducts } = await import(
      "../../src/features/subscription/products.generated"
    );

    const products = getProducts("production");
    expect(products).toBe(productionProducts);
  });
});

describe("getCheckoutProducts helper", () => {
  it("should filter out products without polarProductId", async () => {
    const { getCheckoutProducts } = await import(
      "../../src/features/subscription/products.generated"
    );

    const checkoutProducts = getCheckoutProducts("sandbox");

    // All returned products should have a productId
    for (const product of checkoutProducts) {
      expect(product.productId).not.toBeNull();
    }
  });

  it("should return products in BetterAuth format", async () => {
    const { getCheckoutProducts } = await import(
      "../../src/features/subscription/products.generated"
    );

    const checkoutProducts = getCheckoutProducts("sandbox");

    // Should have the correct shape
    for (const product of checkoutProducts) {
      expect(product).toHaveProperty("productId");
      expect(product).toHaveProperty("slug");
      expect(typeof product.productId).toBe("string");
      expect(typeof product.slug).toBe("string");
    }
  });
});

describe("getDisplayProducts helper", () => {
  it("should only return products with features", async () => {
    const { getDisplayProducts } = await import(
      "../../src/features/subscription/products.generated"
    );

    const displayProducts = getDisplayProducts("sandbox");

    // All returned products should have features
    for (const product of displayProducts) {
      expect(product.display.features.length).toBeGreaterThan(0);
    }
  });
});
