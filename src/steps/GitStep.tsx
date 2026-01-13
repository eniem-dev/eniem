import React, { useEffect, useState } from "react";
import { Box } from "ink";
import { Spinner, SectionHeader, StatusMessage } from "../components/index.js";
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
        <SectionHeader title="Git Repository" />
        <Spinner label={progressMessage} />
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <SectionHeader title="Git Repository" />
        <StatusMessage status="error">{errorMessage}</StatusMessage>
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
