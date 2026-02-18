import { Box } from "ink";
import React from "react";
import { Select } from "../components/index.js";

interface AiPlanSelectorProps {
  specs: string[];
  onSelect: (specName: string) => void;
}

export const AiPlanSelector = ({ specs, onSelect }: AiPlanSelectorProps) => {
  const options = specs.map((s) => ({ label: s, value: s }));

  return (
    <Box flexDirection="column">
      <Select
        label="Which spec do you want to plan?"
        options={options}
        onSelect={onSelect}
      />
    </Box>
  );
};
