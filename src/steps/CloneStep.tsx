import { Box } from "ink";
import React, { useState, useEffect } from "react";
import { Spinner, SectionHeader, StatusMessage } from "../components/index.js";
import { cloneBoilerplate } from "../lib/clone.js";

interface CloneStepProps {
  projectName: string;
  onComplete: (destination: string) => void;
  onError: (error: string) => void;
}

export const CloneStep = ({ projectName, onComplete, onError }: CloneStepProps) => {
  const [status, setStatus] = useState<"cloning" | "complete" | "error">("cloning");
  const [progress, setProgress] = useState("Initializing...");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const runClone = async () => {
      const result = await cloneBoilerplate({
        projectName,
        onProgress: setProgress,
      });

      if (result.success) {
        setStatus("complete");
        onComplete(result.destination);
      } else {
        setStatus("error");
        setErrorMessage(result.error || "Unknown error");
        onError(result.error || "Unknown error");
      }
    };

    runClone();
  }, [projectName, onComplete, onError]);

  if (status === "error") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <SectionHeader title="Cloning Boilerplate" />
        <StatusMessage status="error">Clone failed</StatusMessage>
        <StatusMessage status="error">{errorMessage}</StatusMessage>
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
