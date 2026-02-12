import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { ProductList, SyncStatus } from "../ProductList.js";
import type { Product } from "../../lib/products.js";

function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    slug: "test-product",
    name: "Test Product",
    type: "subscription",
    recurringInterval: "month",
    prices: [{ amountType: "fixed", amount: 1000, currency: "usd" }],
    display: {
      title: "Test Product",
      badge: null,
      features: [],
      highlighted: false,
      cta: "Subscribe",
    },
    ...overrides,
  };
}

describe("ProductList", () => {
  it("renders empty state when no products", () => {
    const { lastFrame } = render(
      <ProductList products={[]} syncStatus={new Map()} />
    );
    expect(lastFrame()).toContain("No products found");
  });

  it("renders product name", () => {
    const product = createProduct({ name: "Pro Plan" });
    const { lastFrame } = render(
      <ProductList products={[product]} syncStatus={new Map()} />
    );
    expect(lastFrame()).toContain("Pro Plan");
  });

  it("renders product slug in parentheses", () => {
    const product = createProduct({ slug: "pro-monthly" });
    const { lastFrame } = render(
      <ProductList products={[product]} syncStatus={new Map()} />
    );
    expect(lastFrame()).toContain("(pro-monthly)");
  });

  it("renders subscription price with period", () => {
    const product = createProduct({
      type: "subscription",
      recurringInterval: "month",
      prices: [{ amountType: "fixed", amount: 1999, currency: "usd" }],
    });
    const { lastFrame } = render(
      <ProductList products={[product]} syncStatus={new Map()} />
    );
    expect(lastFrame()).toContain("$19.99/month");
  });

  it("renders yearly subscription price", () => {
    const product = createProduct({
      type: "subscription",
      recurringInterval: "year",
      prices: [{ amountType: "fixed", amount: 19900, currency: "usd" }],
    });
    const { lastFrame } = render(
      <ProductList products={[product]} syncStatus={new Map()} />
    );
    expect(lastFrame()).toContain("$199/year");
  });

  it("renders one-time price without period", () => {
    const product = createProduct({
      type: "one_time",
      recurringInterval: undefined,
      prices: [{ amountType: "fixed", amount: 4999, currency: "usd" }],
    });
    const { lastFrame } = render(
      <ProductList products={[product]} syncStatus={new Map()} />
    );
    expect(lastFrame()).toContain("$49.99");
    expect(lastFrame()).not.toContain("/");
  });

  it("renders free price", () => {
    const product = createProduct({
      type: "free",
      prices: [{ amountType: "free" }],
    });
    const { lastFrame } = render(
      <ProductList products={[product]} syncStatus={new Map()} />
    );
    expect(lastFrame()).toContain("Free");
  });

  it("renders custom price as pay what you want", () => {
    const product = createProduct({
      prices: [{ amountType: "custom" }],
    });
    const { lastFrame } = render(
      <ProductList products={[product]} syncStatus={new Map()} />
    );
    expect(lastFrame()).toContain("Pay what you want");
  });

  it("renders synced status with checkmark", () => {
    const product = createProduct({ slug: "synced-product" });
    const syncStatus = new Map<string, SyncStatus>([
      ["synced-product", "synced"],
    ]);
    const { lastFrame } = render(
      <ProductList products={[product]} syncStatus={syncStatus} />
    );
    expect(lastFrame()).toContain("✓");
  });

  it("renders not-synced status with circle", () => {
    const product = createProduct({ slug: "not-synced-product" });
    const syncStatus = new Map<string, SyncStatus>([
      ["not-synced-product", "not-synced"],
    ]);
    const { lastFrame } = render(
      <ProductList products={[product]} syncStatus={syncStatus} />
    );
    expect(lastFrame()).toContain("○");
  });

  it("renders error status with X", () => {
    const product = createProduct({ slug: "error-product" });
    const syncStatus = new Map<string, SyncStatus>([["error-product", "error"]]);
    const { lastFrame } = render(
      <ProductList products={[product]} syncStatus={syncStatus} />
    );
    expect(lastFrame()).toContain("✗");
  });

  it("defaults to not-synced when status not in map", () => {
    const product = createProduct({ slug: "unknown-product" });
    const { lastFrame } = render(
      <ProductList products={[product]} syncStatus={new Map()} />
    );
    expect(lastFrame()).toContain("○");
  });

  it("renders multiple products", () => {
    const products = [
      createProduct({ slug: "pro-monthly", name: "Pro Monthly" }),
      createProduct({ slug: "pro-yearly", name: "Pro Yearly" }),
      createProduct({ slug: "enterprise", name: "Enterprise" }),
    ];
    const { lastFrame } = render(
      <ProductList products={products} syncStatus={new Map()} />
    );
    expect(lastFrame()).toContain("Pro Monthly");
    expect(lastFrame()).toContain("Pro Yearly");
    expect(lastFrame()).toContain("Enterprise");
  });

  it("renders mixed sync statuses correctly", () => {
    const products = [
      createProduct({ slug: "synced", name: "Synced Product" }),
      createProduct({ slug: "not-synced", name: "Not Synced Product" }),
      createProduct({ slug: "error", name: "Error Product" }),
    ];
    const syncStatus = new Map<string, SyncStatus>([
      ["synced", "synced"],
      ["not-synced", "not-synced"],
      ["error", "error"],
    ]);
    const { lastFrame } = render(
      <ProductList products={products} syncStatus={syncStatus} />
    );
    expect(lastFrame()).toContain("✓");
    expect(lastFrame()).toContain("○");
    expect(lastFrame()).toContain("✗");
  });

  it("formats whole dollar amounts without cents", () => {
    const product = createProduct({
      type: "one_time",
      prices: [{ amountType: "fixed", amount: 5000, currency: "usd" }],
    });
    const { lastFrame } = render(
      <ProductList products={[product]} syncStatus={new Map()} />
    );
    expect(lastFrame()).toContain("$50");
    expect(lastFrame()).not.toContain("$50.00");
  });
});
