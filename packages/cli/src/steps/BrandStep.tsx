import React, { useEffect, useState, useCallback } from "react";
import { Box } from "ink";
import { Spinner, SectionHeader, StatusMessage, ErrorRecovery } from "../components/index.js";
import { replacePlaceholders } from "../lib/replace.js";

interface BrandStepProps {
  destination: string;
  slug: string;
  appName: string;
  onComplete: () => void;
}

export const BrandStep = ({ destination, slug, appName, onComplete }: BrandStepProps) => {
  const [status, setStatus] = useState<"replacing" | "complete" | "error">("replacing");
  const [progressMessage, setProgressMessage] = useState<string>("Replacing placeholders...");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);

  const replace = useCallback(async () => {
    setStatus("replacing");
    setProgressMessage("Replacing placeholders...");
    setErrorMessage("");

    const result = await replacePlaceholders({
      destination,
      slug,
      appName,
      onProgress: setProgressMessage,
    });

    if (result.success) {
      setSuccessMessage(`Replaced ${result.occurrences} occurrences across ${result.filesModified} files`);
      setStatus("complete");
      onComplete();
    } else {
      setErrorMessage(result.error || "Unknown error");
      setStatus("error");
    }
  }, [destination, slug, appName, onComplete]);

  useEffect(() => {
    replace();
  }, [replace, retryCount]);

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  if (status === "replacing") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <SectionHeader title="Branding" />
        <Spinner label={progressMessage} />
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <SectionHeader title="Branding" />
        <ErrorRecovery
          error={errorMessage}
          onRetry={handleRetry}
          context="Failed to replace placeholders"
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <SectionHeader title="Branding" />
      <StatusMessage status="success">{successMessage}</StatusMessage>
    </Box>
  );
};
