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
  organizationId: string;
}

export interface LoadCredentialsResult {
  success: true;
  credentials: PolarCredentials;
}

export interface LoadCredentialsError {
  success: false;
  missingFields: ("accessToken" | "organizationId")[];
}

export interface CreateProductResult {
  success: true;
  polarProductId: string;
}

export interface CreateProductError {
  success: false;
  error: string;
}

export type PolarEnvironment = "sandbox" | "production";

// ============================================================================
// Credential Loading
// ============================================================================

/**
 * Loads Polar credentials from .env file in the project directory.
 * Returns which fields are missing if not all required credentials are present.
 */
export async function loadPolarCredentials(
  projectDir: string
): Promise<LoadCredentialsResult | LoadCredentialsError> {
  const envPath = join(projectDir, ".env");

  try {
    // Try to read .env file
    const envContent = await readFile(envPath, "utf-8");

    // Parse environment variables from .env content
    const parsed = parseEnvContent(envContent);

    const accessToken = parsed.POLAR_ACCESS_TOKEN;
    const organizationId = parsed.POLAR_ORGANIZATION_ID;

    const missingFields: ("accessToken" | "organizationId")[] = [];

    if (!accessToken || accessToken === "polar_xx") {
      missingFields.push("accessToken");
    }
    if (!organizationId) {
      missingFields.push("organizationId");
    }

    if (missingFields.length > 0) {
      return { success: false, missingFields };
    }

    return {
      success: true,
      credentials: { accessToken, organizationId },
    };
  } catch {
    // .env file not found or unreadable - both fields missing
    return {
      success: false,
      missingFields: ["accessToken", "organizationId"],
    };
  }
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
  const organizationId = process.env.POLAR_ORGANIZATION_ID;

  if (
    !accessToken ||
    accessToken === "polar_xx" ||
    !organizationId
  ) {
    return null;
  }

  return { accessToken, organizationId };
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
 */
export function productToPolarCreate(
  product: Product,
  organizationId: string
): ProductCreate {
  // Map local price to Polar price format
  const price = product.prices[0];
  let polarPrices: ProductCreate["prices"];

  if (!price || price.amountType === "free") {
    polarPrices = [{ amountType: "free" }];
  } else if (price.amountType === "fixed" && price.priceAmount !== undefined) {
    polarPrices = [
      {
        amountType: "fixed",
        priceAmount: price.priceAmount,
        priceCurrency: "usd",
      },
    ];
  } else if (price.amountType === "custom") {
    polarPrices = [
      {
        amountType: "custom",
        priceCurrency: "usd",
        minimumAmount: price.priceAmount ?? 50, // Default to 50 cents minimum
        presetAmount: price.priceAmount ?? 1000, // Default to $10
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
    organizationId,
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
    const createData = productToPolarCreate(product, credentials.organizationId);

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
// Exports for testing
// ============================================================================

export { parseEnvContent as _parseEnvContent };
