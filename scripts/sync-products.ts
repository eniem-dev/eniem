#!/usr/bin/env npx tsx
/**
 * Product Sync CLI
 *
 * Syncs products from JSON config to Polar API and generates TypeScript exports.
 *
 * Usage:
 *   pnpm products:sync              # Sync based on POLAR_SERVER env
 *   pnpm products:sync --env=sandbox
 *   pnpm products:sync --env=production
 *   pnpm products:sync --dry-run    # Preview without making changes
 */

import fs from "node:fs";
import path from "node:path";
import { Polar } from "@polar-sh/sdk";
import { productConfigSchema, type Product, type ProductConfig } from "./products.schema";

// Parse CLI args
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const envArg = args.find((a) => a.startsWith("--env="))?.split("=")[1] as
  | "sandbox"
  | "production"
  | undefined;

// Load environment
const polarServer = envArg || process.env.POLAR_SERVER || "sandbox";
const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
const polarOrganizationId = process.env.POLAR_ORGANIZATION_ID;

if (!polarAccessToken) {
  console.error("Error: POLAR_ACCESS_TOKEN is required");
  process.exit(1);
}

if (!polarOrganizationId) {
  console.error("Error: POLAR_ORGANIZATION_ID is required");
  process.exit(1);
}

// Initialize Polar client
const polarClient = new Polar({
  accessToken: polarAccessToken,
  server: polarServer as "sandbox" | "production",
});

// File paths
const projectRoot = path.resolve(import.meta.dirname, "..");
const jsonPath = path.join(projectRoot, `products.${polarServer}.json`);
const generatedPath = path.join(projectRoot, "src/features/subscription/products.generated.ts");

interface SyncStats {
  created: number;
  updated: number;
  unchanged: number;
  appended: number;
}

async function loadAndValidateConfig(): Promise<ProductConfig> {
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: Config file not found: ${jsonPath}`);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(jsonPath, "utf-8");
  const parsed = JSON.parse(rawJson);

  const result = productConfigSchema.safeParse(parsed);
  if (!result.success) {
    console.error("Validation Error:", result.error.format());
    process.exit(1);
  }

  return result.data;
}

async function fetchExistingProducts(): Promise<Map<string, { id: string; name: string }>> {
  const products = new Map<string, { id: string; name: string }>();

  let page = 1;
  while (true) {
    const response = await polarClient.products.list({
      organizationId: polarOrganizationId,
      page,
      limit: 100,
    });

    for (const product of response.result.items) {
      // Match by slug in metadata or by product ID
      const slug = (product.metadata as Record<string, string>)?.slug;
      if (slug) {
        products.set(slug, { id: product.id, name: product.name });
      }
    }

    if (
      !response.result.pagination ||
      page >= response.result.pagination.maxPage
    ) {
      break;
    }
    page++;
  }

  return products;
}

function buildPolarProductPayload(product: Product) {
  const price = product.prices[0];
  const basePayload = {
    name: product.name,
    description: product.description,
    metadata: { slug: product.slug },
    organizationId: polarOrganizationId,
    prices:
      price.amountType === "fixed"
        ? [
            {
              amountType: "fixed" as const,
              priceAmount: price.amount,
              priceCurrency: price.currency,
            },
          ]
        : price.amountType === "custom"
          ? [
              {
                amountType: "custom" as const,
                minimumAmount: price.minimumAmount,
                maximumAmount: price.maximumAmount,
                presetAmount: price.presetAmount,
                priceCurrency: price.currency,
              },
            ]
          : [{ amountType: "free" as const }],
  };

  if (product.type === "subscription" && product.recurringInterval) {
    return {
      ...basePayload,
      recurringInterval: product.recurringInterval,
      recurringIntervalCount: product.recurringIntervalCount ?? 1,
    };
  }

  return basePayload;
}

async function syncProducts(
  config: ProductConfig,
  existingProducts: Map<string, { id: string; name: string }>
): Promise<{ stats: SyncStats; updatedProducts: Product[] }> {
  const stats: SyncStats = { created: 0, updated: 0, unchanged: 0, appended: 0 };
  const updatedProducts: Product[] = [];

  for (const product of config.products) {
    const existing = existingProducts.get(product.slug);
    const polarId = product.polarProductId || existing?.id;

    if (dryRun) {
      if (polarId) {
        console.log(`[DRY-RUN] Would update: ${product.slug} (${polarId})`);
        stats.updated++;
      } else {
        console.log(`[DRY-RUN] Would create: ${product.slug}`);
        stats.created++;
      }
      updatedProducts.push({ ...product, polarProductId: polarId ?? null });
      continue;
    }

    try {
      if (polarId) {
        // Update existing product
        const payload = buildPolarProductPayload(product);
        await polarClient.products.update({
          id: polarId,
          productUpdate: payload,
        });
        console.log(`Updated: ${product.slug} (${polarId})`);
        stats.updated++;
        updatedProducts.push({ ...product, polarProductId: polarId });
      } else {
        // Create new product
        const payload = buildPolarProductPayload(product);
        const result = await polarClient.products.create({
          body: payload,
        });
        console.log(`Created: ${product.slug} (${result.id})`);
        stats.created++;
        updatedProducts.push({ ...product, polarProductId: result.id });
      }
    } catch (error) {
      console.error(`Failed to sync ${product.slug}:`, error);
      process.exit(1);
    }
  }

  // Check for untracked Polar products
  const configSlugs = new Set(config.products.map((p) => p.slug));
  for (const [slug, { id, name }] of existingProducts) {
    if (!configSlugs.has(slug)) {
      console.log(`Appending untracked product: ${slug} (${id})`);
      stats.appended++;
      updatedProducts.push({
        slug,
        name,
        type: "one_time",
        prices: [{ amountType: "free" }],
        display: {
          title: name,
          subtitle: "TODO: Add subtitle",
          badge: null,
          features: [],
          highlighted: false,
          cta: "Get Started",
        },
        polarProductId: id,
      });
    }
  }

  return { stats, updatedProducts };
}

function updateJsonConfig(products: Product[]) {
  const config: ProductConfig = {
    $schema: "./products.schema.json",
    products,
  };
  fs.writeFileSync(jsonPath, JSON.stringify(config, null, 2) + "\n");
}

function generateTypeScript(sandboxProducts: Product[], productionProducts: Product[]) {
  const formatProduct = (p: Product) => `  {
    slug: "${p.slug}",
    productId: ${p.polarProductId ? `"${p.polarProductId}"` : "null"},
    name: "${p.name}",
    type: "${p.type}",
    display: {
      title: "${p.display.title}",
      subtitle: ${p.display.subtitle ? `"${p.display.subtitle}"` : "undefined"},
      badge: ${p.display.badge ? `"${p.display.badge}"` : "null"},
      features: ${JSON.stringify(p.display.features)},
      highlighted: ${p.display.highlighted},
      cta: "${p.display.cta}",
    },
  }`;

  const content = `// AUTO-GENERATED - DO NOT EDIT
// Generated by scripts/sync-products.ts

export interface ProductDisplay {
  title: string;
  subtitle?: string;
  badge: string | null;
  features: string[];
  highlighted: boolean;
  cta: string;
}

export interface GeneratedProduct {
  slug: string;
  productId: string | null;
  name: string;
  type: "subscription" | "one_time" | "free";
  display: ProductDisplay;
}

export const sandboxProducts: GeneratedProduct[] = [
${sandboxProducts.map(formatProduct).join(",\n")}
] as const;

export const productionProducts: GeneratedProduct[] = [
${productionProducts.map(formatProduct).join(",\n")}
] as const;

export function getProducts(env: "sandbox" | "production"): GeneratedProduct[] {
  return env === "sandbox" ? sandboxProducts : productionProducts;
}

/**
 * BetterAuth checkout products format
 * Only includes products with a valid polarProductId
 */
export function getCheckoutProducts(env: "sandbox" | "production") {
  return getProducts(env)
    .filter((p) => p.productId !== null)
    .map((p) => ({
      productId: p.productId as string,
      slug: p.slug,
    }));
}

/**
 * Get products formatted for pricing page display
 * Only includes products intended for display (with valid features)
 */
export function getDisplayProducts(env: "sandbox" | "production") {
  return getProducts(env).filter((p) => p.display.features.length > 0);
}
`;

  fs.writeFileSync(generatedPath, content);
}

async function main() {
  console.log(`\nProduct Sync - ${polarServer.toUpperCase()}`);
  console.log("=".repeat(40));
  if (dryRun) {
    console.log("DRY RUN MODE - No changes will be made\n");
  }

  // Load and validate config
  console.log(`Loading: ${jsonPath}`);
  const config = await loadAndValidateConfig();
  console.log(`Found ${config.products.length} products in config\n`);

  // Fetch existing Polar products
  console.log("Fetching existing products from Polar...");
  const existingProducts = await fetchExistingProducts();
  console.log(`Found ${existingProducts.size} products in Polar\n`);

  // Sync products
  console.log("Syncing products...\n");
  const { stats, updatedProducts } = await syncProducts(config, existingProducts);

  // Update JSON config with new IDs
  if (!dryRun && (stats.created > 0 || stats.appended > 0)) {
    console.log("\nUpdating JSON config with product IDs...");
    updateJsonConfig(updatedProducts);
  }

  // Generate TypeScript
  if (!dryRun) {
    console.log("Generating TypeScript exports...");

    // Load both configs for generation
    let sandboxProducts: Product[] = [];
    let productionProducts: Product[] = [];

    const sandboxPath = path.join(projectRoot, "products.sandbox.json");
    const productionPath = path.join(projectRoot, "products.production.json");

    if (fs.existsSync(sandboxPath)) {
      const sandboxConfig = JSON.parse(fs.readFileSync(sandboxPath, "utf-8"));
      sandboxProducts = productConfigSchema.parse(sandboxConfig).products;
    }

    if (fs.existsSync(productionPath)) {
      const productionConfig = JSON.parse(fs.readFileSync(productionPath, "utf-8"));
      productionProducts = productConfigSchema.parse(productionConfig).products;
    }

    generateTypeScript(sandboxProducts, productionProducts);
    console.log(`Generated: ${generatedPath}`);
  }

  // Print summary
  console.log("\n" + "=".repeat(40));
  console.log("Summary:");
  console.log(`  Created: ${stats.created}`);
  console.log(`  Updated: ${stats.updated}`);
  console.log(`  Unchanged: ${stats.unchanged}`);
  console.log(`  Appended from Polar: ${stats.appended}`);
  console.log("=".repeat(40) + "\n");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
