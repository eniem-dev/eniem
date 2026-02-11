import { Box } from "ink";
import React, { useEffect } from "react";
import { SectionHeader, StatusMessage } from "../components/index.js";

interface AuthConfig {
  enabled: boolean;
}

interface AuthSetupProps {
  onComplete: (config: AuthConfig) => void;
}

export const AuthSetup = ({ onComplete }: AuthSetupProps) => {
  useEffect(() => {
    // Auto-complete immediately - BetterAuth always enabled
    onComplete({ enabled: true });
  }, [onComplete]);

  return (
    <Box flexDirection="column">
      <SectionHeader title="Authentication (BetterAuth)" />
      <StatusMessage status="success">
        BetterAuth: Enabled
      </StatusMessage>
    </Box>
  );
};
