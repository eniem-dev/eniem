import { Box } from "ink";
import React, { useState } from "react";
import { Confirm, TextInput, SectionHeader, StatusMessage } from "../components/index.js";

interface PaymentConfig {
  enabled: boolean;
  accessToken?: string;
  server?: "sandbox" | "production";
  webhookSecret?: string;
}

interface PaymentSetupProps {
  onComplete: (config: PaymentConfig) => void;
}

type Step = "enable" | "token" | "server" | "webhook" | "done";

export const PaymentSetup = ({ onComplete }: PaymentSetupProps) => {
  const [step, setStep] = useState<Step>("enable");
  const [enabled, setEnabled] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [server, setServer] = useState<"sandbox" | "production">("sandbox");
  const [webhookSecret, setWebhookSecret] = useState("");

  const handleEnableConfirm = (confirmed: boolean) => {
    setEnabled(confirmed);
    if (confirmed) {
      setStep("token");
    } else {
      setStep("done");
      onComplete({ enabled: false });
    }
  };

  const handleTokenSubmit = (value: string) => {
    setAccessToken(value.trim());
    setStep("server");
  };

  const handleServerSubmit = (value: string) => {
    const serverValue = value.trim().toLowerCase() === "production" ? "production" : "sandbox";
    setServer(serverValue);
    setStep("webhook");
  };

  const handleWebhookSubmit = (value: string) => {
    setWebhookSecret(value.trim());
    setStep("done");
    onComplete({
      enabled: true,
      accessToken,
      server,
      webhookSecret: value.trim(),
    });
  };

  return (
    <Box flexDirection="column">
      <SectionHeader title="Payments (Polar)" />

      {step === "enable" && (
        <Confirm label="Configure Polar payments?" onConfirm={handleEnableConfirm} />
      )}

      {step !== "enable" && (
        <StatusMessage status={enabled ? "success" : "skip"}>
          Polar: {enabled ? "Enabled" : "Skipped"}
        </StatusMessage>
      )}

      {step === "token" && (
        <TextInput
          label="Polar Access Token"
          value={accessToken}
          onChange={setAccessToken}
          onSubmit={handleTokenSubmit}
          placeholder="polar_..."
          mask="*"
        />
      )}

      {(step === "server" || step === "webhook" || step === "done") && enabled && accessToken && (
        <StatusMessage status="success">Access token configured</StatusMessage>
      )}

      {step === "server" && (
        <TextInput
          label="Server (sandbox or production)"
          value={server}
          onChange={(v) => setServer(v as "sandbox" | "production")}
          onSubmit={handleServerSubmit}
          placeholder="sandbox"
        />
      )}

      {(step === "webhook" || step === "done") && enabled && (
        <StatusMessage status="success">Server: {server}</StatusMessage>
      )}

      {step === "webhook" && (
        <TextInput
          label="Webhook Secret"
          value={webhookSecret}
          onChange={setWebhookSecret}
          onSubmit={handleWebhookSubmit}
          placeholder="whsec_..."
          mask="*"
        />
      )}

      {step === "done" && enabled && webhookSecret && (
        <StatusMessage status="success">Webhook secret configured</StatusMessage>
      )}
    </Box>
  );
};
