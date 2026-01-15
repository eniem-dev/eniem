import React, { useEffect, useState, useCallback } from "react";
import { Box } from "ink";
import { Spinner, SectionHeader, StatusMessage, ErrorRecovery } from "../components/index.js";
import { writeEnvFile } from "../lib/env.js";
import type { AppConfig } from "../config/types.js";

interface EnvStepProps {
  config: AppConfig;
  destination: string;
  onComplete: (envPath: string) => void;
}

export const EnvStep = ({ config, destination, onComplete }: EnvStepProps) => {
  const [status, setStatus] = useState<"generating" | "complete" | "error">("generating");
  const [envPath, setEnvPath] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);

  const generateEnv = useCallback(async () => {
    setStatus("generating");
    setErrorMessage("");

    const result = await writeEnvFile({ config, destination });

    if (result.success) {
      setEnvPath(result.path);
      setStatus("complete");
      onComplete(result.path);
    } else {
      setErrorMessage(result.error || "Unknown error");
      setStatus("error");
    }
  }, [config, destination, onComplete]);

  useEffect(() => {
    generateEnv();
  }, [generateEnv, retryCount]);

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  if (status === "generating") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <SectionHeader title="Environment Configuration" />
        <Spinner label="Generating .env file..." />
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <SectionHeader title="Environment Configuration" />
        <ErrorRecovery
          error={errorMessage}
          onRetry={handleRetry}
          context="Failed to write .env file"
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <SectionHeader title="Environment Configuration" />
      <StatusMessage status="success">.env file generated at {envPath}</StatusMessage>
    </Box>
  );
};
