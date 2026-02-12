import { Box } from "ink";
import React, { useState } from "react";
import { Confirm, Select, TextInput, SectionHeader, StatusMessage } from "../components/index.js";

type AnalyticsProvider = "umami" | "posthog" | "none";

interface AnalyticsConfig {
  enabled: boolean;
  provider?: AnalyticsProvider;
  siteId?: string;
  hostUrl?: string;
}

interface AnalyticsSetupProps {
  onComplete: (config: AnalyticsConfig) => void;
}

type Step = "enable" | "provider" | "siteId" | "hostUrl" | "done";

export const AnalyticsSetup = ({ onComplete }: AnalyticsSetupProps) => {
  const [step, setStep] = useState<Step>("enable");
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<AnalyticsProvider>("none");
  const [siteId, setSiteId] = useState("");
  const [hostUrl, setHostUrl] = useState("");

  const providerOptions = [
    { label: "Umami", value: "umami" },
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
    setStep("hostUrl");
  };

  const handleHostUrlSubmit = (value: string) => {
    setHostUrl(value.trim());
    setStep("done");
    onComplete({
      enabled: true,
      provider,
      siteId,
      hostUrl: value.trim(),
    });
  };

  const getSiteIdLabel = () => {
    if (provider === "umami") return "Umami Website ID";
    if (provider === "posthog") return "PostHog Key";
    return "Site ID";
  };

  const getSiteIdPlaceholder = () => {
    if (provider === "umami") return "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
    if (provider === "posthog") return "phc_...";
    return "";
  };

  const getHostUrlLabel = () => {
    if (provider === "umami") return "Umami Host URL (optional)";
    if (provider === "posthog") return "PostHog Host URL";
    return "Host URL";
  };

  return (
    <Box flexDirection="column">
      <SectionHeader title="Analytics" />

      {step === "enable" && (
        <Confirm label="Enable analytics?" onConfirm={handleEnableConfirm} />
      )}

      {step !== "enable" && (
        <StatusMessage status={enabled ? "success" : "skip"}>
          Analytics: {enabled ? "Enabled" : "Skipped"}
        </StatusMessage>
      )}

      {step === "provider" && (
        <Select
          label="Select analytics provider:"
          options={providerOptions}
          onSelect={handleProviderSelect}
        />
      )}

      {(step === "siteId" || step === "hostUrl" || step === "done") && enabled && provider !== "none" && (
        <StatusMessage status="success">Provider: {provider}</StatusMessage>
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

      {(step === "hostUrl" || step === "done") && enabled && siteId && (
        <StatusMessage status="success">{getSiteIdLabel()}: {siteId}</StatusMessage>
      )}

      {step === "hostUrl" && (
        <TextInput
          label={getHostUrlLabel()}
          value={hostUrl}
          onChange={setHostUrl}
          onSubmit={handleHostUrlSubmit}
          placeholder={provider === "umami" ? "https://cloud.umami.is" : "https://eu.posthog.com"}
        />
      )}

      {step === "done" && enabled && hostUrl && (
        <StatusMessage status="success">Host: {hostUrl}</StatusMessage>
      )}
    </Box>
  );
};
