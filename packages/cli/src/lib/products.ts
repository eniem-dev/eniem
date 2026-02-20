import { z } from "zod";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

// ============================================================================
// Types and Schemas
// ============================================================================

export const priceSchema = z.object({
  amountType: z.enum(["fixed", "custom", "free"]),
  amount: z.number().int().nonnegative().optional(),
  currency: z.literal("usd").optional(),
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
  recurringIntervalCount: z.number().int().positive().optional(),
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

// Re-export toKebabCase for backward compatibility
export { toKebabCase } from "./string.js";

/**
 * Checks if a slug already exists in a products array
 */
export function slugExists(products: Product[], slug: string): boolean {
  return products.some((p) => p.slug === slug);
}

/**
 * Removes a product from an array by slug.
 * Pure function - returns a new array without mutating the original.
 */
export function removeProduct(products: Product[], slug: string): Product[] {
  return products.filter((p) => p.slug !== slug);
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
 * Reads products from the products.{env}.json file.
 * Supports both direct array format and object with $schema/products properties.
 */
export async function readProductsFile(
  projectDir: string,
  env: string
): Promise<ReadProductsResult | ReadProductsError> {
  const filePath = join(projectDir, `polar/products.${env}.json`);

  try {
    const content = await readFile(filePath, "utf-8");
    const data = JSON.parse(content);

    // Support both formats: direct array or { $schema, products: [] }
    let productsArray: unknown[];
    if (Array.isArray(data)) {
      productsArray = data;
    } else if (data && typeof data === "object" && Array.isArray(data.products)) {
      productsArray = data.products;
    } else {
      return {
        success: false,
        error: `polar/products.${env}.json must contain an array of products (either directly or in a "products" property)`,
      };
    }

    // Parse each product
    const products: Product[] = [];
    for (let i = 0; i < productsArray.length; i++) {
      const result = productSchema.safeParse(productsArray[i]);
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
          error: `polar/products.${env}.json not found. Create the file first or run from an eniem project directory.`,
        };
      }
      if (error instanceof SyntaxError) {
        return {
          success: false,
          error: `polar/products.${env}.json contains invalid JSON: ${error.message}`,
        };
      }
      return {
        success: false,
        error: `Failed to read polar/products.${env}.json: ${error.message}`,
      };
    }
    return {
      success: false,
      error: `Failed to read polar/products.${env}.json: Unknown error`,
    };
  }
}

export interface WriteProductsResult {
  success: boolean;
  path: string;
  error?: string;
}

/**
 * Writes products to the products.{env}.json file.
 * Preserves the $schema wrapper if the file originally had that format.
 */
export async function writeProductsFile(
  projectDir: string,
  env: string,
  products: Product[]
): Promise<WriteProductsResult> {
  const filePath = join(projectDir, `polar/products.${env}.json`);

  try {
    // Check if file exists and has $schema wrapper
    let useWrapper = false;
    let schema: string | undefined;
    try {
      const existingContent = await readFile(filePath, "utf-8");
      const existingData = JSON.parse(existingContent);
      if (existingData && typeof existingData === "object" && !Array.isArray(existingData)) {
        useWrapper = true;
        schema = existingData.$schema;
      }
    } catch {
      // File doesn't exist or is invalid - use wrapper by default
      useWrapper = true;
      schema = "./products.schema.json";
    }

    const output = useWrapper
      ? { $schema: schema, products }
      : products;

    const content = JSON.stringify(output, null, 2) + "\n";
    await writeFile(filePath, content, "utf-8");
    return { success: true, path: filePath };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      path: filePath,
      error: `Failed to write polar/products.${env}.json: ${errorMessage}`,
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

// ============================================================================
// Price Formatting (for TypeScript generation)
// ============================================================================

/**
 * Formats a Price to a display string (e.g., "$19", "$5+", "$0")
 */
export function formatPrice(price: Price): string {
  if (price.amountType === "free") return "$0";
  if (price.amountType === "custom") {
    const amount = price.amount ?? 0;
    return `$${Math.floor(amount / 100)}+`;
  }
  // Fixed price
  const dollars = (price.amount ?? 0) / 100;
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

/**
 * Gets the period string for a product (e.g., "/month", "/year")
 */
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

// ============================================================================
// TypeScript Generation
// ============================================================================

export interface GenerateResult {
  success: boolean;
  path?: string;
  error?: string;
}

/**
 * Generates products.generated.ts from sandbox and production JSON files.
 * Output is written to src/features/subscription/products.generated.ts
 */
export async function generateProductsTs(projectDir: string): Promise<GenerateResult> {
  const outputPath = join(projectDir, "src/features/subscription/products.generated.ts");

  // Read both environment files
  const sandboxResult = await readProductsFile(projectDir, "sandbox");
  const productionResult = await readProductsFile(projectDir, "production");

  // Handle missing files gracefully - use empty array if not found
  const sandboxProducts = sandboxResult.success ? sandboxResult.products : [];
  const productionProducts = productionResult.success ? productionResult.products : [];

  // If both files are missing, return error
  if (!sandboxResult.success && !productionResult.success) {
    return {
      success: false,
      error: "No products files found. Create polar/products.sandbox.json or polar/products.production.json first.",
    };
  }

  // Generate TypeScript content
  const content = generateTsContent(sandboxProducts, productionProducts);

  // Write file
  try {
    // Ensure directory exists
    const { mkdir } = await import("fs/promises");
    const dir = join(projectDir, "src/features/subscription");
    await mkdir(dir, { recursive: true });

    await writeFile(outputPath, content, "utf-8");
    return { success: true, path: outputPath };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to write products.generated.ts: ${errorMessage}`,
    };
  }
}

/**
 * Generates the TypeScript file content from product arrays
 */
function generateTsContent(sandboxProducts: Product[], productionProducts: Product[]): string {
  const lines: string[] = [
    "// AUTO-GENERATED - DO NOT EDIT",
    "// Generated by eniem-cli",
    "",
    "export interface ProductDisplay {",
    "  title: string;",
    "  subtitle?: string;",
    "  price: string;",
    "  period?: string;",
    "  badge: string | null;",
    "  features: string[];",
    "  highlighted: boolean;",
    "  cta: string;",
    "}",
    "",
    "export interface GeneratedProduct {",
    "  slug: string;",
    "  productId: string | null;",
    "  name: string;",
    '  type: "subscription" | "one_time" | "free";',
    "  display: ProductDisplay;",
    "}",
    "",
  ];

  // Generate sandbox products array
  lines.push("export const sandboxProducts: GeneratedProduct[] = [");
  for (const product of sandboxProducts) {
    lines.push(generateProductLiteral(product));
  }
  lines.push("] as const;");
  lines.push("");

  // Generate production products array
  lines.push("export const productionProducts: GeneratedProduct[] = [");
  for (const product of productionProducts) {
    lines.push(generateProductLiteral(product));
  }
  lines.push("] as const;");
  lines.push("");

  // Add helper functions
  lines.push('export function getProducts(env: "sandbox" | "production"): GeneratedProduct[] {');
  lines.push('  return env === "sandbox" ? sandboxProducts : productionProducts;');
  lines.push("}");
  lines.push("");
  lines.push("/**");
  lines.push(" * BetterAuth checkout products format");
  lines.push(" * Only includes products with a valid polarProductId");
  lines.push(" */");
  lines.push('export function getCheckoutProducts(env: "sandbox" | "production") {');
  lines.push("  return getProducts(env)");
  lines.push("    .filter((p) => p.productId !== null)");
  lines.push("    .map((p) => ({");
  lines.push("      productId: p.productId as string,");
  lines.push("      slug: p.slug,");
  lines.push("    }));");
  lines.push("}");
  lines.push("");
  lines.push("/**");
  lines.push(" * Get products formatted for pricing page display");
  lines.push(" * Only includes products intended for display (with valid features)");
  lines.push(" */");
  lines.push('export function getDisplayProducts(env: "sandbox" | "production") {');
  lines.push("  return getProducts(env).filter((p) => p.display.features.length > 0);");
  lines.push("}");
  lines.push("");

  return lines.join("\n");
}

/**
 * Escapes a string for safe interpolation in TypeScript string literals
 */
function escapeForTs(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Generates a single product object literal
 */
function generateProductLiteral(product: Product): string {
  const price = product.prices[0];
  const priceStr = price ? formatPrice(price) : "$0";
  const periodStr = formatPeriod(product);

  const featuresStr = JSON.stringify(product.display.features);
  const badgeStr = product.display.badge ? `"${escapeForTs(product.display.badge)}"` : "null";
  const subtitleStr = product.display.subtitle ? `"${escapeForTs(product.display.subtitle)}"` : "undefined";
  const periodOutput = periodStr ? `"${periodStr}"` : "undefined";
  const productIdStr = product.polarProductId ? `"${escapeForTs(product.polarProductId)}"` : "null";

  return `  {
    slug: "${escapeForTs(product.slug)}",
    productId: ${productIdStr},
    name: "${escapeForTs(product.name)}",
    type: "${product.type}",
    display: {
      title: "${escapeForTs(product.display.title)}",
      subtitle: ${subtitleStr},
      price: "${priceStr}",
      period: ${periodOutput},
      badge: ${badgeStr},
      features: ${featuresStr},
      highlighted: ${product.display.highlighted},
      cta: "${escapeForTs(product.display.cta)}",
    },
  },`;
}
