import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { Spinner } from "../components/index.js";
import { initGitRepo } from "../lib/git.js";

interface GitStepProps {
  destination: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

export const GitStep = ({ destination, onComplete, onError }: GitStepProps) => {
  const [status, setStatus] = useState<"initializing" | "complete" | "error">("initializing");
  const [progressMessage, setProgressMessage] = useState<string>("Preparing git repository...");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const initGit = async () => {
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
        onError(result.error || "Unknown error");
      }
    };

    initGit();
  }, [destination, onComplete, onError]);

  if (status === "initializing") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold color="cyan">Git Repository</Text>
        <Box marginTop={1}>
          <Spinner label={progressMessage} />
        </Box>
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold color="cyan">Git Repository</Text>
        <Box marginTop={1}>
          <Text color="red">✗ {errorMessage}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold color="cyan">Git Repository</Text>
      <Box marginTop={1}>
        <Text color="green">✓ Fresh git repository initialized with initial commit</Text>
      </Box>
    </Box>
  );
};
