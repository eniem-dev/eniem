import { Box, Text } from "ink";
import React, { useState } from "react";
import { Confirm, TextInput } from "../components/index.js";

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
      <Text bold color="magenta">
        Payments (Polar)
      </Text>

      {step === "enable" && (
        <Confirm label="Enable Polar payments?" onConfirm={handleEnableConfirm} />
      )}

      {step !== "enable" && (
        <Text color={enabled ? "green" : "yellow"}>
          {enabled ? "✓" : "○"} Polar: {enabled ? "Enabled" : "Skipped"}
        </Text>
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
        <Text color="green">✓ Access token configured</Text>
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
        <Text color="green">✓ Organization: {organizationId}</Text>
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
        <Text color="green">✓ Webhook secret configured</Text>
      )}
    </Box>
  );
};
