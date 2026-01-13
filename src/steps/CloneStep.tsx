import { Box, Text } from "ink";
import React, { useState, useEffect } from "react";
import { Spinner } from "../components/index.js";
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
      <Box flexDirection="column">
        <Text bold color="red">
          ✗ Clone failed
        </Text>
        <Text color="red">{errorMessage}</Text>
      </Box>
    );
  }

  if (status === "complete") {
    return (
      <Box>
        <Text bold color="green">
          ✓ Project cloned to {projectName}/
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold color="blue">
        Cloning boilerplate
      </Text>
      <Spinner label={progress} />
    </Box>
  );
};
