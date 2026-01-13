import { Box, Text } from "ink";
import React, { useState } from "react";
import { Confirm, Select, TextInput } from "../components/index.js";

type AnalyticsProvider = "plausible" | "posthog" | "none";

interface AnalyticsConfig {
  enabled: boolean;
  provider?: AnalyticsProvider;
  siteId?: string;
  apiKey?: string;
}

interface AnalyticsSetupProps {
  onComplete: (config: AnalyticsConfig) => void;
}

type Step = "enable" | "provider" | "siteId" | "apiKey" | "done";

export const AnalyticsSetup = ({ onComplete }: AnalyticsSetupProps) => {
  const [step, setStep] = useState<Step>("enable");
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<AnalyticsProvider>("none");
  const [siteId, setSiteId] = useState("");
  const [apiKey, setApiKey] = useState("");

  const providerOptions = [
    { label: "Plausible", value: "plausible" },
    { label: "PostHog", value: "posthog" },
  ];

  const handleEnableConfirm = (confirmed: boolean) => {
    setEnabled(confirmed);
    if (confirmed) {
      setStep("provider");
    } else {
      setStep("done");
      onComplete({ enabled: false });
    }
  };

  const handleProviderSelect = (value: string) => {
    setProvider(value as AnalyticsProvider);
    setStep("siteId");
  };

  const handleSiteIdSubmit = (value: string) => {
    setSiteId(value.trim());
    setStep("apiKey");
  };

  const handleApiKeySubmit = (value: string) => {
    setApiKey(value.trim());
    setStep("done");
    onComplete({
      enabled: true,
      provider,
      siteId,
      apiKey: value.trim(),
    });
  };

  const getSiteIdLabel = () => {
    if (provider === "plausible") return "Plausible Domain";
    if (provider === "posthog") return "PostHog Project ID";
    return "Site ID";
  };

  const getSiteIdPlaceholder = () => {
    if (provider === "plausible") return "mysite.com";
    if (provider === "posthog") return "phc_...";
    return "";
  };

  const getApiKeyLabel = () => {
    if (provider === "plausible") return "Plausible API Key (optional)";
    if (provider === "posthog") return "PostHog API Key";
    return "API Key";
  };

  return (
    <Box flexDirection="column">
      <Text bold color="magenta">
        Analytics
      </Text>

      {step === "enable" && (
        <Confirm label="Enable analytics?" onConfirm={handleEnableConfirm} />
      )}

      {step !== "enable" && (
        <Text color={enabled ? "green" : "yellow"}>
          {enabled ? "✓" : "○"} Analytics: {enabled ? "Enabled" : "Skipped"}
        </Text>
      )}

      {step === "provider" && (
        <Select
          label="Select analytics provider:"
          options={providerOptions}
          onSelect={handleProviderSelect}
        />
      )}

      {(step === "siteId" || step === "apiKey" || step === "done") && enabled && provider !== "none" && (
        <Text color="green">✓ Provider: {provider}</Text>
      )}

      {step === "siteId" && (
        <TextInput
          label={getSiteIdLabel()}
          value={siteId}
          onChange={setSiteId}
          onSubmit={handleSiteIdSubmit}
          placeholder={getSiteIdPlaceholder()}
        />
      )}

      {(step === "apiKey" || step === "done") && enabled && siteId && (
        <Text color="green">✓ {getSiteIdLabel()}: {siteId}</Text>
      )}

      {step === "apiKey" && (
        <TextInput
          label={getApiKeyLabel()}
          value={apiKey}
          onChange={setApiKey}
          onSubmit={handleApiKeySubmit}
          placeholder="..."
          mask="*"
        />
      )}

      {step === "done" && enabled && apiKey && (
        <Text color="green">✓ API key configured</Text>
      )}
    </Box>
  );
};
