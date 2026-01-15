import { Box } from "ink";
import React, { useState } from "react";
import { Confirm, TextInput, SectionHeader, StatusMessage } from "../components/index.js";

interface Web3Config {
  enabled: boolean;
  walletConnectProjectId?: string;
}

interface Web3SetupProps {
  onComplete: (config: Web3Config) => void;
}

type Step = "enable" | "projectId" | "done";

export const Web3Setup = ({ onComplete }: Web3SetupProps) => {
  const [step, setStep] = useState<Step>("enable");
  const [enabled, setEnabled] = useState(false);
  const [projectId, setProjectId] = useState("");

  const handleEnableConfirm = (confirmed: boolean) => {
    setEnabled(confirmed);
    if (confirmed) {
      setStep("projectId");
    } else {
      setStep("done");
      onComplete({ enabled: false });
    }
  };

  const handleProjectIdSubmit = (value: string) => {
    setProjectId(value.trim());
    setStep("done");
    onComplete({
      enabled: true,
      walletConnectProjectId: value.trim(),
    });
  };

  return (
    <Box flexDirection="column">
      <SectionHeader title="Web3 (WalletConnect)" />

      {step === "enable" && (
        <Confirm label="Enable WalletConnect?" onConfirm={handleEnableConfirm} />
      )}

      {step !== "enable" && (
        <StatusMessage status={enabled ? "success" : "skip"}>
          WalletConnect: {enabled ? "Enabled" : "Skipped"}
        </StatusMessage>
      )}

      {step === "projectId" && (
        <TextInput
          label="WalletConnect Project ID"
          value={projectId}
          onChange={setProjectId}
          onSubmit={handleProjectIdSubmit}
          placeholder="Get from cloud.walletconnect.com"
        />
      )}

      {step === "done" && enabled && projectId && (
        <StatusMessage status="success">Project ID: {projectId}</StatusMessage>
      )}
    </Box>
  );
};
