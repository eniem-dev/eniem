import React, { useEffect, useState } from "react";
import { Box } from "ink";
import { Spinner, SectionHeader, StatusMessage } from "../components/index.js";
import { writeEnvFile } from "../lib/env.js";
import type { AppConfig } from "../config/types.js";

interface EnvStepProps {
  config: AppConfig;
  destination: string;
  onComplete: (envPath: string) => void;
  onError: (error: string) => void;
}

export const EnvStep = ({ config, destination, onComplete, onError }: EnvStepProps) => {
  const [status, setStatus] = useState<"generating" | "complete" | "error">("generating");
  const [envPath, setEnvPath] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const generateEnv = async () => {
      const result = await writeEnvFile({ config, destination });

      if (result.success) {
        setEnvPath(result.path);
        setStatus("complete");
        onComplete(result.path);
      } else {
        setErrorMessage(result.error || "Unknown error");
        setStatus("error");
        onError(result.error || "Unknown error");
      }
    };

    generateEnv();
  }, [config, destination, onComplete, onError]);

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
        <StatusMessage status="error">{errorMessage}</StatusMessage>
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
