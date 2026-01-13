import { Box, Text } from "ink";
import React from "react";
import type { AppConfig } from "../config/types.js";

interface WizardProgressProps {
  config: AppConfig;
}

export const WizardProgress = ({ config }: WizardProgressProps) => {
  const items: string[] = [];

  // Project info
  if (config.project?.name) {
    items.push(`Project: ${config.project.name}`);
  }
  if (config.project?.url) {
    items.push(`URL: ${config.project.url}`);
  }

  // Enabled features
  const features: string[] = [];
  if (config.oauth?.github) features.push("GitHub");
  if (config.oauth?.twitter) features.push("Twitter");
  if (config.payment?.enabled) features.push("Payment");
  if (config.storage?.enabled) features.push("Storage");
  if (config.web3?.enabled) features.push("Web3");
  if (config.analytics?.enabled && config.analytics.provider !== "none") {
    features.push(`Analytics (${config.analytics.provider})`);
  }

  if (features.length > 0) {
    items.push(`Features: ${features.join(", ")}`);
  }

  // Don't render if nothing to show yet
  if (items.length === 0) {
    return null;
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text dimColor>─── Configuration ───</Text>
      {items.map((item, index) => (
        <Text key={index} dimColor>
          {item}
        </Text>
      ))}
      <Text dimColor>─────────────────────</Text>
    </Box>
  );
};
