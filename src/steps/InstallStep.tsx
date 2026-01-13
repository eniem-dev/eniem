import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { Spinner } from "../components/index.js";
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
        <Text bold color="cyan">Installing Dependencies</Text>
        <Box marginTop={1}>
          <Spinner label={progressMessage} />
        </Box>
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold color="cyan">Installing Dependencies</Text>
        <Box marginTop={1}>
          <Text color="red">✗ {errorMessage}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold color="cyan">Installing Dependencies</Text>
      <Box marginTop={1}>
        <Text color="green">✓ Dependencies installed successfully</Text>
      </Box>
    </Box>
  );
};
