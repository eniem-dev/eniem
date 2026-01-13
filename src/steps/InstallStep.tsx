import React, { useEffect, useState } from "react";
import { Box } from "ink";
import { Spinner, SectionHeader, StatusMessage } from "../components/index.js";
import { runPnpmInstall } from "../lib/install.js";

interface InstallStepProps {
  destination: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

export const InstallStep = ({ destination, onComplete, onError }: InstallStepProps) => {
  const [status, setStatus] = useState<"installing" | "complete" | "error">("installing");
  const [progressMessage, setProgressMessage] = useState<string>("Preparing to install dependencies...");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const install = async () => {
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
        onError(result.error || "Unknown error");
      }
    };

    install();
  }, [destination, onComplete, onError]);

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
        <StatusMessage status="error">{errorMessage}</StatusMessage>
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
