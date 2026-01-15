import React, { useEffect, useState, useCallback } from "react";
import { Box } from "ink";
import { Spinner, SectionHeader, StatusMessage, ErrorRecovery } from "../components/index.js";
import { runPnpmInstall } from "../lib/install.js";

interface InstallStepProps {
  destination: string;
  onComplete: () => void;
}

export const InstallStep = ({ destination, onComplete }: InstallStepProps) => {
  const [status, setStatus] = useState<"installing" | "complete" | "error">("installing");
  const [progressMessage, setProgressMessage] = useState<string>("Preparing to install dependencies...");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);

  const install = useCallback(async () => {
    setStatus("installing");
    setProgressMessage("Preparing to install dependencies...");
    setErrorMessage("");

    const result = await runPnpmInstall({
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
    install();
  }, [install, retryCount]);

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  if (status === "installing") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <SectionHeader title="Installing Dependencies" />
        <Spinner label={progressMessage} />
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <SectionHeader title="Installing Dependencies" />
        <ErrorRecovery
          error={errorMessage}
          onRetry={handleRetry}
          context="Failed to install dependencies"
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <SectionHeader title="Installing Dependencies" />
      <StatusMessage status="success">Dependencies installed successfully</StatusMessage>
    </Box>
  );
};
