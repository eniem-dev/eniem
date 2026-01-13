import { Box, Text } from "ink";
import InkSpinner from "ink-spinner";
import React from "react";

interface SpinnerProps {
  label: string;
}

export const Spinner = ({ label }: SpinnerProps) => {
  return (
    <Box>
      <Text color="cyan">
        <InkSpinner type="dots" />
      </Text>
      <Text> {label}</Text>
    </Box>
  );
};
