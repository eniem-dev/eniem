import { Polar } from "@polar-sh/sdk";
import type { Product as PolarProduct } from "@polar-sh/sdk/models/components/product.js";
import type { ProductCreate } from "@polar-sh/sdk/models/components/productcreate.js";
import { readFile } from "fs/promises";
import { join } from "path";
import type { Product } from "./products.js";
import { parseEnvContent } from "./env-ready.js";
import { handlePolarApiError } from "./polar-errors.js";

// ============================================================================
// Types
// ============================================================================

export interface PolarCredentials {
  accessToken: string;
}

export interface LoadCredentialsResult {
  success: true;
  credentials: PolarCredentials;
}

export interface LoadCredentialsError {
  success: false;
  missingFields: ("accessToken")[];
}

export interface CreateProductResult {
  success: true;
  polarProductId: string;
}

export interface CreateProductError {
  success: false;
  error: string;
}

export type CheckProductExistsResult =
  | { exists: true; isArchived: false }
  | { exists: true; isArchived: true }
  | { exists: false }
  | { exists: false; error: string };

export type UpdateProductResult =
  | { success: true }
  | { success: false; error: string };

export type ArchiveProductResult =
  | { success: true }
  | { success: false; error: string };

export type UnarchiveProductResult =
  | { success: true }
  | { success: false; error: string };

export interface PolarProductInfo {
  id: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  slug?: string;
  isRecurring: boolean;
  recurringInterval: "month" | "year" | null;
  prices: Array<{
    amountType: "free" | "fixed" | "custom";
    priceAmount: number | null;
    priceCurrency: string | null;
  }>;
}

export type ListPolarProductsResult =
  | { success: true; products: PolarProductInfo[] }
  | { success: false; error: string };

export type PolarEnvironment = "sandbox" | "production";

// ============================================================================
// Credential Loading
// ============================================================================

/**
 * Loads Polar credentials from .env or .env.local file in the project directory.
 * Tries .env.local first, then falls back to .env.
 * Returns which fields are missing if not all required credentials are present.
 */
export async function loadPolarCredentials(
  projectDir: string
): Promise<LoadCredentialsResult | LoadCredentialsError> {
  // Try .env.local first, then .env
  const envFiles = [".env.local", ".env"];
  let envContent: string | null = null;

  for (const envFile of envFiles) {
    try {
      envContent = await readFile(join(projectDir, envFile), "utf-8");
      break;
    } catch {
      // Try next file
    }
  }

  if (!envContent) {
    // No env file found
    return {
      success: false,
      missingFields: ["accessToken"],
    };
  }

  // Parse environment variables from .env content
  const parsed = parseEnvContent(envContent);

  const accessToken = parsed.POLAR_ACCESS_TOKEN;

  if (!accessToken || accessToken === "polar_xx") {
    return {
      success: false,
      missingFields: ["accessToken"],
    };
  }

  return {
    success: true,
    credentials: { accessToken },
  };
}

// ============================================================================
// Polar API Client
// ============================================================================

/**
 * Creates a Polar SDK client configured for the specified environment.
 */
export function createPolarClient(
  accessToken: string,
  environment: PolarEnvironment
): Polar {
  return new Polar({
    accessToken,
    server: environment,
  });
}

/**
 * Converts a local Product to the Polar API ProductCreate format.
 * Note: organizationId is not included - Polar infers it from the token.
 */
export function productToPolarCreate(
  product: Product
): ProductCreate {
  // Map local price to Polar price format
  const price = product.prices[0];
  let polarPrices: ProductCreate["prices"];

  if (!price || price.amountType === "free") {
    polarPrices = [{ amountType: "free" }];
  } else if (price.amountType === "fixed" && price.amount !== undefined) {
    polarPrices = [
      {
        amountType: "fixed",
        priceAmount: price.amount,
        priceCurrency: "usd",
      },
    ];
  } else if (price.amountType === "custom") {
    polarPrices = [
      {
        amountType: "custom",
        priceCurrency: "usd",
        minimumAmount: price.amount ?? 50, // Default to 50 cents minimum
        presetAmount: price.amount ?? 1000, // Default to $10
      },
    ];
  } else {
    // Default to free if price type is unclear
    polarPrices = [{ amountType: "free" }];
  }

  // Map recurring interval - Polar only supports month and year
  // For subscriptions, we need to map day/week to month (not supported by Polar)
  let recurringInterval: "month" | "year" | null = null;
  if (product.type === "subscription" && product.recurringInterval) {
    if (
      product.recurringInterval === "month" ||
      product.recurringInterval === "year"
    ) {
      recurringInterval = product.recurringInterval;
    } else if (product.recurringInterval === "week") {
      // Polar doesn't support weekly, treat as monthly
      recurringInterval = "month";
    } else if (product.recurringInterval === "day") {
      // Polar doesn't support daily, treat as monthly
      recurringInterval = "month";
    }
  }

  return {
    name: product.name,
    description: product.description ?? null,
    recurringInterval,
    prices: polarPrices,
    metadata: {
      slug: product.slug,
      source: "eniem-cli",
    },
  };
}

/**
 * Creates a product on the Polar API.
 * Returns the polarProductId on success, or an error message on failure.
 */
export async function createPolarProduct(
  credentials: PolarCredentials,
  product: Product,
  environment: PolarEnvironment
): Promise<CreateProductResult | CreateProductError> {
  try {
    const client = createPolarClient(credentials.accessToken, environment);
    const createData = productToPolarCreate(product);

    const result: PolarProduct = await client.products.create(createData);

    return {
      success: true,
      polarProductId: result.id,
    };
  } catch (error) {
    return handlePolarApiError(error, "create product on Polar");
  }
}

// ============================================================================
// Product Update
// ============================================================================

/**
 * Converts a local Product to the Polar API ProductUpdate format.
 * Only includes fields that should be updated - not the full product.
 */
export function productToPolarUpdate(product: Product): {
  name: string;
  description: string | null;
  metadata: { slug: string; source: string };
} {
  return {
    name: product.name,
    description: product.description ?? null,
    metadata: {
      slug: product.slug,
      source: "eniem-cli",
    },
  };
}

/**
 * Updates an existing product on the Polar API.
 * Returns success on update, or an error message on failure.
 */
export async function updatePolarProduct(
  credentials: PolarCredentials,
  productId: string,
  product: Product,
  environment: PolarEnvironment
): Promise<UpdateProductResult> {
  try {
    const client = createPolarClient(credentials.accessToken, environment);
    const updateData = productToPolarUpdate(product);

    await client.products.update({
      id: productId,
      productUpdate: updateData,
    });

    return { success: true };
  } catch (error) {
    return handlePolarApiError(error, "update product on Polar");
  }
}

/**
 * Archives a product on the Polar API.
 * Polar doesn't support deleting products, only archiving them.
 * Archived products won't be available for purchase but existing
 * customers retain access.
 */
export async function archivePolarProduct(
  credentials: PolarCredentials,
  productId: string,
  environment: PolarEnvironment
): Promise<ArchiveProductResult> {
  try {
    const client = createPolarClient(credentials.accessToken, environment);

    await client.products.update({
      id: productId,
      productUpdate: { isArchived: true },
    });

    return { success: true };
  } catch (error) {
    return handlePolarApiError(error, "archive product on Polar");
  }
}

// ============================================================================
// Product Verification
// ============================================================================

/**
 * Checks if a product exists on Polar by its ID.
 * Returns { exists: true, isArchived: false } if the product exists and is active.
 * Returns { exists: true, isArchived: true } if the product exists but is archived.
 * Returns { exists: false } if the product does not exist (404).
 * Returns { exists: false, error: string } if there was an error checking.
 */
export async function checkProductExists(
  credentials: PolarCredentials,
  productId: string,
  environment: PolarEnvironment
): Promise<CheckProductExistsResult> {
  try {
    const client = createPolarClient(credentials.accessToken, environment);
    const product = await client.products.get({ id: productId });
    return { exists: true, isArchived: product.isArchived ?? false };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // 404 means the product doesn't exist (expected case)
    if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
      return { exists: false };
    }

    // Other errors indicate a failure to check
    return {
      exists: false,
      error: `Failed to verify product existence: ${errorMessage}`,
    };
  }
}

/**
 * Unarchives a product on the Polar API.
 * Restores an archived product so it can be purchased again.
 */
export async function unarchivePolarProduct(
  credentials: PolarCredentials,
  productId: string,
  environment: PolarEnvironment
): Promise<UnarchiveProductResult> {
  try {
    const client = createPolarClient(credentials.accessToken, environment);

    await client.products.update({
      id: productId,
      productUpdate: { isArchived: false },
    });

    return { success: true };
  } catch (error) {
    return handlePolarApiError(error, "unarchive product on Polar");
  }
}

/**
 * Lists all products from Polar for the organization.
 * Returns products with full details including price, description, and recurring info.
 */
export async function listPolarProducts(
  credentials: PolarCredentials,
  environment: PolarEnvironment
): Promise<ListPolarProductsResult> {
  try {
    const client = createPolarClient(credentials.accessToken, environment);

    // Fetch all products (including archived)
    const allProducts: PolarProductInfo[] = [];
    let page = 1;
    const limit = 100;

    while (true) {
      const result = await client.products.list({ page, limit });

      for (const product of result.result.items) {
        const slug = product.metadata && typeof product.metadata === "object"
          ? (product.metadata as Record<string, unknown>).slug as string | undefined
          : undefined;

        // Extract price information
        const prices: PolarProductInfo["prices"] = [];
        if (product.prices && Array.isArray(product.prices)) {
          for (const price of product.prices) {
            if (price.amountType === "free") {
              prices.push({ amountType: "free", priceAmount: null, priceCurrency: null });
            } else if (price.amountType === "fixed") {
              prices.push({
                amountType: "fixed",
                priceAmount: price.priceAmount ?? null,
                priceCurrency: price.priceCurrency ?? "usd",
              });
            } else if (price.amountType === "custom") {
              prices.push({
                amountType: "custom",
                priceAmount: price.minimumAmount ?? null,
                priceCurrency: price.priceCurrency ?? "usd",
              });
            }
          }
        }

        // Default to free if no prices
        if (prices.length === 0) {
          prices.push({ amountType: "free", priceAmount: null, priceCurrency: null });
        }

        allProducts.push({
          id: product.id,
          name: product.name,
          description: product.description ?? null,
          isArchived: product.isArchived ?? false,
          slug,
          isRecurring: product.isRecurring ?? false,
          recurringInterval: product.recurringInterval ?? null,
          prices,
        });
      }

      // Check if there are more pages
      if (result.result.items.length < limit) {
        break;
      }
      page++;
    }

    return { success: true, products: allProducts };
  } catch (error) {
    return handlePolarApiError(error, "list products from Polar");
  }
}

