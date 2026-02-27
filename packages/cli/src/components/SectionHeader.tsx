import { Box, Text } from "ink";
import React from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export const SectionHeader = ({ title, subtitle }: SectionHeaderProps) => {
  return (
    <Box marginBottom={1}>
      <Text bold color="magenta">
        {title}
        {subtitle ? <Text dimColor> — {subtitle}</Text> : null}
      </Text>
    </Box>
  );
};
