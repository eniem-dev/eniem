import React, { useEffect, useState, useCallback } from "react";
import { Box } from "ink";
import { Spinner, SectionHeader, StatusMessage, ErrorRecovery } from "../components/index.js";
import { initGitRepo } from "../lib/git.js";

interface GitStepProps {
  destination: string;
  onComplete: () => void;
}

export const GitStep = ({ destination, onComplete }: GitStepProps) => {
  const [status, setStatus] = useState<"initializing" | "complete" | "error">("initializing");
  const [progressMessage, setProgressMessage] = useState<string>("Preparing git repository...");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);

  const initGit = useCallback(async () => {
    setStatus("initializing");
    setProgressMessage("Preparing git repository...");
    setErrorMessage("");

    const result = await initGitRepo({
      destination,
      onProgress: setProgressMessage,
    });

    if (result.success) {
      setStatus("complete");
      onComplete();
    } else {
      setErrorMessage(result.error || "Unknown error");
      setStatus("error");
    }
  }, [destination, onComplete]);

  useEffect(() => {
    void initGit();
  }, [initGit, retryCount]);

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  if (status === "initializing") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <SectionHeader title="Git Repository" />
        <Spinner label={progressMessage} />
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <SectionHeader title="Git Repository" />
        <ErrorRecovery
          error={errorMessage}
          onRetry={handleRetry}
          context="Failed to initialize git repository"
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <SectionHeader title="Git Repository" />
      <StatusMessage status="success">Fresh git repository initialized with initial commit</StatusMessage>
    </Box>
  );
};
