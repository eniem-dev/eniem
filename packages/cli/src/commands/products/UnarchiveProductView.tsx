import { Box, Text } from "ink";
import React from "react";
import { Confirm, Spinner, MultiSelect } from "../../components/index.js";
import type { SyncStatus } from "../../components/index.js";
import type { Product } from "../../lib/products.js";
import type { UseProductsManagerReturn } from "../hooks/useProductsManager.js";

type Props = Pick<UseProductsManagerReturn, "step" | "selectedSlugs" | "handleUnarchiveSelect" | "handleUnarchiveConfirm"> & {
  products: Product[];
  syncStatus: Map<string, SyncStatus>;
};

export const UnarchiveProductView = ({ step, products, syncStatus, selectedSlugs, handleUnarchiveSelect, handleUnarchiveConfirm }: Props) => (
  <>
    {step === "select_for_unarchive" && (
      <MultiSelect label="Select archived products to unarchive"
        items={products
          .filter((p) => syncStatus.get(p.slug) === "archived")
          .map((p) => ({ label: `${p.name} (${p.slug})`, value: p.slug }))}
        onSubmit={handleUnarchiveSelect} />
    )}

    {step === "confirm_unarchive" && (
      <Box flexDirection="column">
        <Text>You are about to unarchive {selectedSlugs.length} product{selectedSlugs.length !== 1 ? "s" : ""} on Polar:</Text>
        <Box flexDirection="column" marginLeft={2} marginTop={1}>
          {selectedSlugs.map((slug) => <Text key={slug}>- {slug}</Text>)}
        </Box>
        <Box marginTop={1}><Text dimColor>These products will become available for purchase again.</Text></Box>
        <Box marginTop={1}>
          <Confirm label="Continue with unarchive?" onConfirm={handleUnarchiveConfirm} defaultValue={true} />
        </Box>
      </Box>
    )}

    {step === "unarchiving" && <Spinner label="Unarchiving products on Polar..." />}
  </>
);
