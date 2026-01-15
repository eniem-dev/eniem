import { Box, Text } from "ink";
import React from "react";

interface SectionHeaderProps {
  title: string;
}

export const SectionHeader = ({ title }: SectionHeaderProps) => {
  return (
    <Box marginBottom={1}>
      <Text bold color="magenta">
        {title}
      </Text>
    </Box>
  );
};
