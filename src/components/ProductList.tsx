import { Box, Text } from "ink";
import InkSpinner from "ink-spinner";
import React from "react";
import type { Product } from "../lib/products.js";

export type SyncStatus = "synced" | "not-synced" | "error" | "checking" | "archived";

interface ProductListProps {
  products: Product[];
  syncStatus: Map<string, SyncStatus>;
}

function formatPrice(product: Product): string {
  const price = product.prices[0];
  if (!price || price.amountType === "free") {
    return "Free";
  }
  if (price.amountType === "custom") {
    return "Pay what you want";
  }
  if (price.amount === undefined) {
    return "Free";
  }
  const dollars = price.amount / 100;
  const formattedPrice = `$${dollars.toFixed(dollars % 1 === 0 ? 0 : 2)}`;

  if (product.type === "subscription" && product.recurringInterval) {
    return `${formattedPrice}/${product.recurringInterval}`;
  }
  return formattedPrice;
}

function getSyncIcon(status: SyncStatus): { icon: string; color?: string; label?: string } {
  switch (status) {
    case "synced":
      return { icon: "✓", color: "green" };
    case "not-synced":
      return { icon: "○", color: "yellow" };
    case "archived":
      return { icon: "⊘", color: "magenta", label: "archived" };
    case "error":
      return { icon: "✗", color: "red" };
    case "checking":
      return { icon: "spinner" };
  }
}

export const ProductList = ({ products, syncStatus }: ProductListProps) => {
  if (products.length === 0) {
    return (
      <Box>
        <Text dimColor>No products found</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {products.map((product) => {
        const status = syncStatus.get(product.slug) ?? "not-synced";
        const { icon, color, label } = getSyncIcon(status);
        const priceDisplay = formatPrice(product);

        return (
          <Box key={product.slug} gap={1}>
            {icon === "spinner" ? (
              <Text color="cyan">
                <InkSpinner type="dots" />
              </Text>
            ) : (
              <Text color={color}>{icon}</Text>
            )}
            <Text>
              {product.name} ({product.slug}) - {priceDisplay}
              {label && <Text color={color}> [{label}]</Text>}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};
