import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import React from "react";

type Operation = "add" | "remove" | "sync" | "regenerate";

interface SelectOption {
  label: string;
  value: Operation;
}

interface OperationMenuProps {
  onSelect: (operation: Operation) => void;
  hasProducts: boolean;
}

const ALL_OPTIONS: SelectOption[] = [
  { label: "Add new product", value: "add" },
  { label: "Remove products", value: "remove" },
  { label: "Sync products to Polar", value: "sync" },
  { label: "Regenerate TypeScript exports", value: "regenerate" },
];

const ADD_ONLY_OPTION: SelectOption[] = [
  { label: "Add new product", value: "add" },
];

export const OperationMenu = ({
  onSelect,
  hasProducts,
}: OperationMenuProps) => {
  const handleSelect = (item: SelectOption) => {
    onSelect(item.value);
  };

  const options = hasProducts ? ALL_OPTIONS : ADD_ONLY_OPTION;

  return (
    <Box flexDirection="column">
      {!hasProducts && (
        <Box marginBottom={1}>
          <Text color="yellow">No products found.</Text>
        </Box>
      )}
      <Text bold color="blue">
        What would you like to do?
      </Text>
      <SelectInput items={options} onSelect={handleSelect} />
    </Box>
  );
};
