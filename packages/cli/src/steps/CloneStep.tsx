import { Box } from "ink";
import React, { useState, useEffect, useCallback } from "react";
import { Spinner, SectionHeader, StatusMessage, ErrorRecovery } from "../components/index.js";
import { cloneBoilerplate, type Protocol } from "../lib/clone.js";

interface CloneStepProps {
  projectName: string;
  gitHost: string;
  protocol?: Protocol;
  onComplete: (destination: string) => void;
}

export const CloneStep = ({ projectName, gitHost, protocol, onComplete }: CloneStepProps) => {
  const [status, setStatus] = useState<"cloning" | "complete" | "error">("cloning");
  const [progress, setProgress] = useState("Initializing...");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);

  const runClone = useCallback(async () => {
    setStatus("cloning");
    setProgress("Initializing...");
    setErrorMessage("");

    const result = await cloneBoilerplate({
      projectName,
      gitHost,
      protocol,
      onProgress: setProgress,
    });

    if (result.success) {
      setStatus("complete");
      onComplete(result.destination);
    } else {
      setStatus("error");
      setErrorMessage(result.error || "Unknown error");
    }
  }, [projectName, gitHost, protocol, onComplete]);

  useEffect(() => {
    void runClone();
  }, [runClone, retryCount]);

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  if (status === "error") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <SectionHeader title="Cloning Boilerplate" />
        <ErrorRecovery
          error={errorMessage}
          onRetry={handleRetry}
          context="Failed to clone the boilerplate repository"
        />
      </Box>
    );
  }

  if (status === "complete") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <SectionHeader title="Cloning Boilerplate" />
        <StatusMessage status="success">Project cloned to {projectName}/</StatusMessage>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <SectionHeader title="Cloning Boilerplate" />
      <Spinner label={progress} />
    </Box>
  );
};
