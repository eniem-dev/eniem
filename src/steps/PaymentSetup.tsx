import { Box } from "ink";
import React, { useState } from "react";
import { Confirm, TextInput, SectionHeader, StatusMessage } from "../components/index.js";

interface PaymentConfig {
  enabled: boolean;
  accessToken?: string;
  organizationId?: string;
  webhookSecret?: string;
}

interface PaymentSetupProps {
  onComplete: (config: PaymentConfig) => void;
}

type Step = "enable" | "token" | "org" | "webhook" | "done";

export const PaymentSetup = ({ onComplete }: PaymentSetupProps) => {
  const [step, setStep] = useState<Step>("enable");
  const [enabled, setEnabled] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useState("");
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
    setStep("org");
  };

  const handleOrgSubmit = (value: string) => {
    setOrganizationId(value.trim());
    setStep("webhook");
  };

  const handleWebhookSubmit = (value: string) => {
    setWebhookSecret(value.trim());
    setStep("done");
    onComplete({
      enabled: true,
      accessToken,
      organizationId,
      webhookSecret: value.trim(),
    });
  };

  return (
    <Box flexDirection="column">
      <SectionHeader title="Payments (Polar)" />

      {step === "enable" && (
        <Confirm label="Enable Polar payments?" onConfirm={handleEnableConfirm} />
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

      {(step === "org" || step === "webhook" || step === "done") && enabled && accessToken && (
        <StatusMessage status="success">Access token configured</StatusMessage>
      )}

      {step === "org" && (
        <TextInput
          label="Organization ID"
          value={organizationId}
          onChange={setOrganizationId}
          onSubmit={handleOrgSubmit}
          placeholder="org_..."
        />
      )}

      {(step === "webhook" || step === "done") && enabled && organizationId && (
        <StatusMessage status="success">Organization: {organizationId}</StatusMessage>
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
