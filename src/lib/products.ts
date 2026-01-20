import { z } from "zod";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

// ============================================================================
// Types and Schemas
// ============================================================================

export const priceSchema = z.object({
  amountType: z.enum(["fixed", "custom", "free"]),
  priceAmount: z.number().int().nonnegative().optional(),
  priceCurrency: z.literal("usd").optional(),
});

export type Price = z.infer<typeof priceSchema>;

export const displaySchema = z.object({
  title: z.string().min(1, "Display title is required"),
  subtitle: z.string().optional(),
  badge: z.string().nullable(),
  features: z.array(z.string()),
  highlighted: z.boolean(),
  cta: z.string().min(1, "CTA text is required"),
});

export type Display = z.infer<typeof displaySchema>;

// Slug: kebab-case, lowercase alphanumeric with hyphens
export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(99, "Slug must be 99 characters or less")
  .regex(
    /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/,
    "Slug must be kebab-case (lowercase letters, numbers, hyphens, starting with a letter)"
  );

export const productSchema = z.object({
  slug: slugSchema,
  name: z
    .string()
    .min(1, "Product name is required")
    .max(99, "Product name must be 99 characters or less"),
  description: z
    .string()
    .max(200, "Description must be 200 characters or less")
    .optional(),
  type: z.enum(["subscription", "one_time", "free"]),
  recurringInterval: z.enum(["day", "week", "month", "year"]).optional(),
  prices: z.array(priceSchema),
  display: displaySchema,
  polarProductId: z.string().nullable().optional(),
});

export type Product = z.infer<typeof productSchema>;

// Extended schema with recurring interval requirement for subscriptions
export const productSchemaWithValidation = productSchema.refine(
  (data) => {
    if (data.type === "subscription" && !data.recurringInterval) {
      return false;
    }
    return true;
  },
  {
    message: "Recurring interval is required for subscription products",
    path: ["recurringInterval"],
  }
);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Converts a string to kebab-case for use as a slug
 */
export function toKebabCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+/, "") // Remove leading hyphens
    .replace(/-+$/, "") // Remove trailing hyphens
    .replace(/-{2,}/g, "-"); // Replace multiple hyphens with single
}

/**
 * Checks if a slug already exists in a products array
 */
export function slugExists(products: Product[], slug: string): boolean {
  return products.some((p) => p.slug === slug);
}

/**
 * Validates a slug against the schema
 */
export function validateSlug(
  slug: string
): { success: true; data: string } | { success: false; error: string } {
  const result = slugSchema.safeParse(slug);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.errors[0]?.message ?? "Invalid slug",
  };
}

/**
 * Validates a complete product
 */
export function validateProduct(
  product: unknown
): { success: true; data: Product } | { success: false; error: string } {
  const result = productSchemaWithValidation.safeParse(product);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.errors[0]?.message ?? "Invalid product",
  };
}

// ============================================================================
// File Operations
// ============================================================================

export interface ReadProductsResult {
  success: true;
  products: Product[];
}

export interface ReadProductsError {
  success: false;
  error: string;
}

/**
 * Reads products from the products.{env}.json file
 */
export async function readProductsFile(
  projectDir: string,
  env: string
): Promise<ReadProductsResult | ReadProductsError> {
  const filePath = join(projectDir, `products.${env}.json`);

  try {
    const content = await readFile(filePath, "utf-8");
    const data = JSON.parse(content);

    // Validate that it's an array
    if (!Array.isArray(data)) {
      return {
        success: false,
        error: `products.${env}.json must contain an array of products`,
      };
    }

    // Parse each product
    const products: Product[] = [];
    for (let i = 0; i < data.length; i++) {
      const result = productSchema.safeParse(data[i]);
      if (!result.success) {
        return {
          success: false,
          error: `Invalid product at index ${i}: ${result.error.errors[0]?.message}`,
        };
      }
      products.push(result.data);
    }

    return { success: true, products };
  } catch (error) {
    if (error instanceof Error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return {
          success: false,
          error: `products.${env}.json not found. Create the file first or run from an eniem project directory.`,
        };
      }
      if (error instanceof SyntaxError) {
        return {
          success: false,
          error: `products.${env}.json contains invalid JSON: ${error.message}`,
        };
      }
      return {
        success: false,
        error: `Failed to read products.${env}.json: ${error.message}`,
      };
    }
    return {
      success: false,
      error: `Failed to read products.${env}.json: Unknown error`,
    };
  }
}

export interface WriteProductsResult {
  success: boolean;
  path: string;
  error?: string;
}

/**
 * Writes products to the products.{env}.json file
 */
export async function writeProductsFile(
  projectDir: string,
  env: string,
  products: Product[]
): Promise<WriteProductsResult> {
  const filePath = join(projectDir, `products.${env}.json`);

  try {
    const content = JSON.stringify(products, null, 2) + "\n";
    await writeFile(filePath, content, "utf-8");
    return { success: true, path: filePath };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      path: filePath,
      error: `Failed to write products.${env}.json: ${errorMessage}`,
    };
  }
}

/**
 * Converts price in dollars (e.g., "19" or "19.00") to cents
 */
export function dollarsToCents(dollars: string | number): number {
  const amount = typeof dollars === "string" ? parseFloat(dollars) : dollars;
  return Math.round(amount * 100);
}

/**
 * Validates that a price meets the minimum (50 cents)
 */
export function validatePrice(
  cents: number
): { success: true } | { success: false; error: string } {
  if (cents < 50) {
    return {
      success: false,
      error: "Price must be at least $0.50 (50 cents)",
    };
  }
  return { success: true };
}

/**
 * Generates a yearly slug from a monthly slug
 * e.g., "pro-monthly" -> "pro-yearly", "pro" -> "pro-yearly"
 */
export function generateYearlySlug(monthlySlug: string): string {
  if (monthlySlug.endsWith("-monthly")) {
    return monthlySlug.replace(/-monthly$/, "-yearly");
  }
  return `${monthlySlug}-yearly`;
}

/**
 * Generates a yearly display title from a monthly title
 * e.g., "Pro" -> "Pro Yearly"
 */
export function generateYearlyTitle(monthlyTitle: string): string {
  return `${monthlyTitle} Yearly`;
}

/**
 * Calculates suggested yearly price (10x monthly = 2 months free)
 */
export function calculateYearlyPrice(monthlyCents: number): number {
  return monthlyCents * 10;
}
