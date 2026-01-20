import { Polar } from "@polar-sh/sdk";
import type { Product as PolarProduct } from "@polar-sh/sdk/models/components/product.js";
import type { ProductCreate } from "@polar-sh/sdk/models/components/productcreate.js";
import { config as dotenvConfig } from "dotenv";
import { readFile } from "fs/promises";
import { join } from "path";
import type { Product } from "./products.js";

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
  | { exists: true }
  | { exists: false }
  | { exists: false; error: string };

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

/**
 * Parses .env file content into a key-value object.
 * Handles basic .env format (KEY=value, # comments, empty lines).
 */
function parseEnvContent(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Remove surrounding quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

/**
 * Loads credentials using dotenv (for runtime use with process.env).
 * Falls back to parsing .env manually if dotenv doesn't work.
 */
export function loadCredentialsFromEnv(): PolarCredentials | null {
  // Load from process.env (requires dotenv to be configured)
  dotenvConfig();

  const accessToken = process.env.POLAR_ACCESS_TOKEN;

  if (!accessToken || accessToken === "polar_xx") {
    return null;
  }

  return { accessToken };
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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Check for common error patterns
    if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
      return {
        success: false,
        error: "Invalid Polar access token. Please check your credentials.",
      };
    }

    if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
      return {
        success: false,
        error:
          "Access denied. Please check your organization ID and token permissions.",
      };
    }

    if (errorMessage.includes("404")) {
      return {
        success: false,
        error: "Organization not found. Please verify your organization ID.",
      };
    }

    if (errorMessage.includes("422") || errorMessage.includes("validation")) {
      return {
        success: false,
        error: `Validation error: ${errorMessage}`,
      };
    }

    return {
      success: false,
      error: `Failed to create product on Polar: ${errorMessage}`,
    };
  }
}

// ============================================================================
// Product Verification
// ============================================================================

/**
 * Checks if a product exists on Polar by its ID.
 * Returns { exists: true } if the product exists.
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
    await client.products.get({ id: productId });
    return { exists: true };
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

// ============================================================================
// Exports for testing
// ============================================================================

export { parseEnvContent as _parseEnvContent };
