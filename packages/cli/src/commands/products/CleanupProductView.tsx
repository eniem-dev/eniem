import { Box, Text } from "ink";
import React from "react";
import { Select, Spinner, MultiSelect } from "../../components/index.js";
import type { UseProductsManagerReturn } from "../hooks/useProductsManager.js";

type Props = Pick<
  UseProductsManagerReturn,
  | "step" | "orphanedPolarProducts" | "selectedPolarProductIds" | "cleanupAction"
  | "handleCleanupSelect" | "handleCleanupActionSelect"
>;

const formatPrice = (price: { amountType: string; priceAmount?: number | null }) => {
  if (price.amountType === "free") return "Free";
  if (price.amountType === "custom") return `$${((price.priceAmount ?? 0) / 100).toFixed(0)}+`;
  if (price.priceAmount) return `$${(price.priceAmount / 100).toFixed(price.priceAmount % 100 === 0 ? 0 : 2)}`;
  return "Free";
};

export const CleanupProductView = ({
  step, orphanedPolarProducts, selectedPolarProductIds, cleanupAction,
  handleCleanupSelect, handleCleanupActionSelect,
}: Props) => (
  <>
    {step === "loading_polar_products" && <Spinner label="Loading products from Polar..." />}

    {step === "show_orphaned_products" && (
      <Box flexDirection="column">
        <Text>Found {orphanedPolarProducts.length} product{orphanedPolarProducts.length !== 1 ? "s" : ""} on Polar that are not in your local file:</Text>
        <Box flexDirection="column" marginLeft={2} marginTop={1} marginBottom={1}>
          {orphanedPolarProducts.map((p) => {
            const price = p.prices[0];
            const priceStr = price ? formatPrice(price) : "Free";
            const typeStr = p.isRecurring ? `/${p.recurringInterval}` : "";
            return <Text key={p.id} dimColor>- {p.name} ({priceStr}{typeStr})</Text>;
          })}
        </Box>
        <MultiSelect label="Select products to clean up"
          items={orphanedPolarProducts.map((p) => {
            const price = p.prices[0];
            const priceStr = price ? formatPrice(price) : "Free";
            const typeStr = p.isRecurring ? `/${p.recurringInterval}` : "";
            return { label: `${p.name} (${priceStr}${typeStr})`, value: p.id };
          })}
          onSubmit={handleCleanupSelect} />
      </Box>
    )}

    {step === "confirm_cleanup" && (
      <Box flexDirection="column">
        <Text>What would you like to do with {selectedPolarProductIds.length} selected product{selectedPolarProductIds.length !== 1 ? "s" : ""}?</Text>
        <Box marginTop={1}>
          <Select label="Cleanup action" options={[
            { label: "Archive on Polar (remove from sale)", value: "archive" },
            { label: "Import to local file (create minimal entries)", value: "import" },
          ]} onSelect={handleCleanupActionSelect} />
        </Box>
      </Box>
    )}

    {step === "cleaning_up" && (
      <Spinner label={cleanupAction === "archive" ? "Archiving products on Polar..." : "Importing products to local file..."} />
    )}
  </>
);
