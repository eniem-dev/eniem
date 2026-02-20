import { Box, Text } from "ink";
import React from "react";
import { Confirm, Spinner, MultiSelect } from "../../components/index.js";
import type { Product } from "../../lib/products.js";
import type { UseProductsManagerReturn } from "../hooks/useProductsManager.js";

type Props = Pick<UseProductsManagerReturn, "step" | "selectedSlugs" | "handleSyncSelect" | "handleSyncConfirm"> & {
  products: Product[];
};

export const SyncProductView = ({ step, products, selectedSlugs, handleSyncSelect, handleSyncConfirm }: Props) => (
  <>
    {step === "select_for_sync" && (
      <MultiSelect label="Select products to sync"
        items={products.map((p) => ({ label: `${p.name} (${p.slug})`, value: p.slug }))}
        onSubmit={handleSyncSelect} />
    )}

    {step === "confirm_sync" && (
      <Box flexDirection="column">
        <Text>You are about to sync {selectedSlugs.length} product{selectedSlugs.length !== 1 ? "s" : ""} to Polar:</Text>
        <Box flexDirection="column" marginLeft={2} marginTop={1}>
          {selectedSlugs.map((slug) => {
            const product = products.find((p) => p.slug === slug);
            const hasId = product?.polarProductId;
            return <Text key={slug}>- {slug} {hasId ? "(update)" : "(create new)"}</Text>;
          })}
        </Box>
        <Box marginTop={1}>
          <Confirm label="Continue with sync?" onConfirm={handleSyncConfirm} defaultValue={true} />
        </Box>
      </Box>
    )}

    {step === "syncing" && <Spinner label="Syncing products to Polar..." />}
  </>
);
