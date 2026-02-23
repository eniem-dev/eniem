import { Box, Text } from "ink";
import React from "react";
import { Confirm, Spinner, MultiSelect } from "../../components/index.js";
import type { UseProductsManagerReturn } from "../hooks/useProductsManager.js";

type Props = Pick<
  UseProductsManagerReturn,
  | "step" | "sandboxProducts" | "selectedSlugs"
  | "handleSandboxSyncPrompt" | "handleSandboxProductSelect" | "handleSandboxSyncConfirm"
>;

export const SandboxSyncView = ({
  step, sandboxProducts, selectedSlugs,
  handleSandboxSyncPrompt, handleSandboxProductSelect, handleSandboxSyncConfirm,
}: Props) => (
  <>
    {step === "ask_sandbox_sync" && (
      <Box flexDirection="column">
        <Text>You are running in production mode.</Text>
        <Box marginTop={1}>
          <Confirm label="Would you like to sync sandbox products to production?"
            onConfirm={handleSandboxSyncPrompt} defaultValue={true} />
        </Box>
      </Box>
    )}

    {step === "loading_sandbox_products" && <Spinner label="Loading sandbox products..." />}

    {step === "select_sandbox_products" && (
      <Box flexDirection="column">
        {sandboxProducts.length === 0 ? (
          <Box flexDirection="column">
            <Text>No sandbox products found to sync.</Text>
            <Box marginTop={1}><Text dimColor>Continuing to production menu...</Text></Box>
          </Box>
        ) : (
          <MultiSelect label="Select sandbox products to create in production"
            items={sandboxProducts.map((p) => ({ label: `${p.name} (${p.slug})`, value: p.slug }))}
            onSubmit={handleSandboxProductSelect} />
        )}
      </Box>
    )}

    {step === "confirm_sandbox_sync" && (
      <Box flexDirection="column">
        <Text>You are about to create {selectedSlugs.length} product{selectedSlugs.length !== 1 ? "s" : ""} in production:</Text>
        <Box flexDirection="column" marginLeft={2} marginTop={1}>
          {selectedSlugs.map((slug) => {
            const product = sandboxProducts.find((p) => p.slug === slug);
            return <Text key={slug}>- {product?.name ?? slug} ({slug})</Text>;
          })}
        </Box>
        <Box marginTop={1}><Text dimColor>These will be created as new products on Polar production.</Text></Box>
        <Box marginTop={1}>
          <Confirm label="Continue with sandbox to production sync?"
            onConfirm={handleSandboxSyncConfirm} defaultValue={true} />
        </Box>
      </Box>
    )}

    {step === "syncing_sandbox_to_prod" && <Spinner label="Creating products in production..." />}
  </>
);
