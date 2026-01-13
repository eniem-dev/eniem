import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import React from "react";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
}

export const Select = ({ label, options, onSelect }: SelectProps) => {
  const handleSelect = (item: SelectOption) => {
    onSelect(item.value);
  };

  return (
    <Box flexDirection="column">
      <Text bold color="blue">
        {label}
      </Text>
      <SelectInput items={options} onSelect={handleSelect} />
    </Box>
  );
};
