import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import React from "react";

type Operation = "add" | "remove" | "sync" | "regenerate" | "unarchive" | "cleanup" | "sync_from_sandbox";

interface SelectOption {
  label: string;
  value: Operation;
}

interface OperationMenuProps {
  onSelect: (operation: Operation) => void;
  hasProducts: boolean;
  hasArchivedProducts?: boolean;
  showSyncFromSandbox?: boolean;
}

export const OperationMenu = ({
  onSelect,
  hasProducts,
  hasArchivedProducts = false,
  showSyncFromSandbox = false,
}: OperationMenuProps) => {
  const handleSelect = (item: SelectOption) => {
    onSelect(item.value);
  };

  // Build options dynamically based on state
  const options: SelectOption[] = [];

  // Show sync from sandbox option prominently when available
  if (showSyncFromSandbox) {
    options.push({ label: "Sync products from sandbox", value: "sync_from_sandbox" });
  }

  options.push({ label: "Add new product", value: "add" });

  if (hasProducts) {
    options.push(
      { label: "Remove products", value: "remove" },
      { label: "Sync products to Polar", value: "sync" },
    );
    if (hasArchivedProducts) {
      options.push({ label: "Unarchive products on Polar", value: "unarchive" });
    }
    options.push(
      { label: "Clean up Polar products", value: "cleanup" },
      { label: "Regenerate TypeScript exports", value: "regenerate" },
    );
  }

  return (
    <Box flexDirection="column">
      {!hasProducts && !showSyncFromSandbox && (
        <Box marginBottom={1}>
          <Text color="yellow">No products found.</Text>
        </Box>
      )}
      {!hasProducts && showSyncFromSandbox && (
        <Box marginBottom={1}>
          <Text color="yellow">No products found. Sandbox products are available to sync.</Text>
        </Box>
      )}
      <Text bold color="blue">
        What would you like to do?
      </Text>
      <SelectInput items={options} onSelect={handleSelect} />
    </Box>
  );
};
