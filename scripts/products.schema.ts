import { z } from "zod";

// Price type schemas
const fixedPriceSchema = z.object({
  amountType: z.literal("fixed"),
  amount: z.number().int().min(50).max(99999999), // cents, min 50 (Polar minimum)
  currency: z.literal("usd"),
});

const customPriceSchema = z.object({
  amountType: z.literal("custom"),
  minimumAmount: z.number().int().min(50).optional(),
  maximumAmount: z.number().int().max(99999999).optional(),
  presetAmount: z.number().int().optional(),
  currency: z.literal("usd"),
});

const freePriceSchema = z.object({
  amountType: z.literal("free"),
});

const priceSchema = z.discriminatedUnion("amountType", [
  fixedPriceSchema,
  customPriceSchema,
  freePriceSchema,
]);

// Display schema for pricing UI
// Note: price and period are calculated from prices array, not stored in JSON
const displaySchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  badge: z.string().nullable().optional(),
  features: z.array(z.string()),
  highlighted: z.boolean().default(false),
  cta: z.string().default("Get Started"),
});

// Product schema
const productSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  name: z.string().min(1).max(99),
  description: z.string().max(200).optional(),
  type: z.enum(["subscription", "one_time", "free"]),
  recurringInterval: z.enum(["day", "week", "month", "year"]).optional(),
  recurringIntervalCount: z.number().int().min(1).max(999).default(1).optional(),
  prices: z.array(priceSchema).min(1),
  display: displaySchema,
  polarProductId: z.string().uuid().nullable().optional(),
});

// Full config schema with duplicate slug validation
export const productConfigSchema = z
  .object({
    $schema: z.string().optional(),
    products: z.array(productSchema),
  })
  .refine(
    (data) => {
      const slugs = data.products.map((p) => p.slug);
      return new Set(slugs).size === slugs.length;
    },
    { message: "Duplicate product slugs found" }
  )
  .refine(
    (data) => {
      return data.products.every((p) => {
        if (p.type === "subscription") {
          return p.recurringInterval !== undefined;
        }
        return true;
      });
    },
    { message: "Subscription products require recurringInterval" }
  );

// Type exports
export type Price = z.infer<typeof priceSchema>;
export type FixedPrice = z.infer<typeof fixedPriceSchema>;
export type CustomPrice = z.infer<typeof customPriceSchema>;
export type FreePrice = z.infer<typeof freePriceSchema>;
export type ProductDisplay = z.infer<typeof displaySchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductConfig = z.infer<typeof productConfigSchema>;

// Helper to format cents to display price
export function formatPrice(price: Price): string {
  if (price.amountType === "free") return "$0";
  if (price.amountType === "custom") {
    const preset = price.presetAmount ?? price.minimumAmount ?? 0;
    return `$${Math.floor(preset / 100)}+`;
  }
  // Fixed price
  const dollars = price.amount / 100;
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

// Helper to get period string from product
export function formatPeriod(product: Product): string | undefined {
  if (product.type !== "subscription" || !product.recurringInterval) {
    return undefined;
  }
  const count = product.recurringIntervalCount ?? 1;
  if (count === 1) {
    return `/${product.recurringInterval}`;
  }
  return `/${count} ${product.recurringInterval}s`;
}
