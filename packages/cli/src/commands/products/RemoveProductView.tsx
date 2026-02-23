import { Box, Text } from "ink";
import React from "react";
import { Confirm, Spinner, MultiSelect } from "../../components/index.js";
import type { Product } from "../../lib/products.js";
import type { UseProductsManagerReturn } from "../hooks/useProductsManager.js";

type Props = Pick<UseProductsManagerReturn, "step" | "selectedSlugs" | "handleRemoveSelect" | "handleRemoveConfirm"> & {
  products: Product[];
};

export const RemoveProductView = ({ step, products, selectedSlugs, handleRemoveSelect, handleRemoveConfirm }: Props) => (
  <>
    {step === "select_for_remove" && (
      <MultiSelect label="Select products to remove"
        items={products.map((p) => ({ label: `${p.name} (${p.slug})`, value: p.slug }))}
        onSubmit={handleRemoveSelect} />
    )}

    {step === "confirm_remove" && (
      <Box flexDirection="column">
        <Text color="yellow">
          You are about to remove {selectedSlugs.length} product{selectedSlugs.length !== 1 ? "s" : ""}:
        </Text>
        <Box flexDirection="column" marginLeft={2} marginTop={1}>
          {selectedSlugs.map((slug) => <Text key={slug}>- {slug}</Text>)}
        </Box>
        {selectedSlugs.length === products.length && (
          <Box marginTop={1}><Text color="red" bold>Warning: This will remove ALL products!</Text></Box>
        )}
        <Box marginTop={1}>
          <Confirm label="Are you sure you want to remove these products?"
            onConfirm={handleRemoveConfirm} defaultValue={false} />
        </Box>
      </Box>
    )}

    {step === "removing" && <Spinner label="Removing products..." />}
  </>
);
