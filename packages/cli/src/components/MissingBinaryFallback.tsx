import { Box, Text } from "ink";
import React from "react";

import type { CLIAdapter } from "../lib/adapters/index.js";
import { SUPPORTED_CLIS } from "../lib/adapters/index.js";

import { Select } from "./Select.js";
import { StatusMessage } from "./StatusMessage.js";

interface MissingBinaryFallbackProps {
  missing: string;
  available: CLIAdapter[];
  onSelect: (adapter: CLIAdapter) => void;
}

export const MissingBinaryFallback = ({
  missing,
  available,
  onSelect,
}: MissingBinaryFallbackProps) => {
  if (available.length === 0) {
    return (
      <Box flexDirection="column">
        <StatusMessage status="error">
          {missing} binary not found on PATH
        </StatusMessage>
        <Box marginTop={1} flexDirection="column">
          <Text>No supported CLI is installed. Install one of:</Text>
          {SUPPORTED_CLIS.map((cli) => (
            <Text key={cli} dimColor>
              {"  "}• {cli}
            </Text>
          ))}
        </Box>
      </Box>
    );
  }

  const options = available.map((a) => ({
    label: `${a.name} (${a.id})`,
    value: a.id,
  }));

  const handleSelect = (value: string) => {
    const adapter = available.find((a) => a.id === value);
    if (adapter) onSelect(adapter);
  };

  return (
    <Box flexDirection="column">
      <StatusMessage status="error">
        {missing} binary not found on PATH
      </StatusMessage>
      <Box marginTop={1}>
        <Select
          label="Choose an available CLI:"
          options={options}
          onSelect={handleSelect}
        />
      </Box>
    </Box>
  );
};
