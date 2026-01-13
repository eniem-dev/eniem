import { Box, Text } from "ink";
import InkTextInput from "ink-text-input";
import React from "react";

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  mask?: string;
  error?: string;
}

export const TextInput = ({
  label,
  value,
  onChange,
  onSubmit,
  placeholder,
  mask,
  error,
}: TextInputProps) => {
  return (
    <Box flexDirection="column">
      <Box>
        <Text bold color="blue">
          {label}:{" "}
        </Text>
        <InkTextInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          placeholder={placeholder}
          mask={mask}
        />
      </Box>
      {error && (
        <Text color="red">  ✗ {error}</Text>
      )}
    </Box>
  );
};
