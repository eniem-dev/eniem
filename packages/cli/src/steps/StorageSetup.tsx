import { Box } from "ink";
import React, { useState } from "react";
import { Confirm, TextInput, SectionHeader, StatusMessage } from "../components/index.js";
import type { StorageConfig } from "../config/types.js";

interface StorageSetupProps {
  onComplete: (config: StorageConfig) => void;
}

type Step = "enable" | "endpoint" | "bucket" | "keyId" | "secretKey" | "region" | "done";

export const StorageSetup = ({ onComplete }: StorageSetupProps) => {
  const [step, setStep] = useState<Step>("enable");
  const [enabled, setEnabled] = useState(false);
  const [endpoint, setEndpoint] = useState("");
  const [bucket, setBucket] = useState("");
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [region, setRegion] = useState("");

  const handleEnableConfirm = (confirmed: boolean) => {
    setEnabled(confirmed);
    if (confirmed) {
      setStep("endpoint");
    } else {
      setStep("done");
      onComplete({ enabled: false });
    }
  };

  const handleEndpointSubmit = (value: string) => {
    if (!value.trim()) return;
    setEndpoint(value.trim());
    setStep("bucket");
  };

  const handleBucketSubmit = (value: string) => {
    if (!value.trim()) return;
    setBucket(value.trim());
    setStep("keyId");
  };

  const handleKeyIdSubmit = (value: string) => {
    if (!value.trim()) return;
    setAccessKeyId(value.trim());
    setStep("secretKey");
  };

  const handleSecretKeySubmit = (value: string) => {
    if (!value.trim()) return;
    setSecretAccessKey(value.trim());
    setStep("region");
  };

  const handleRegionSubmit = (value: string) => {
    if (!value.trim()) return;
    setRegion(value.trim());
    setStep("done");
    onComplete({
      enabled: true,
      endpoint,
      bucket,
      accessKeyId,
      secretAccessKey,
      region: value.trim(),
    });
  };

  return (
    <Box flexDirection="column">
      <SectionHeader title="Storage (DigitalOcean Spaces)" />

      {step === "enable" && (
        <Confirm label="Configure DO Spaces storage?" onConfirm={handleEnableConfirm} />
      )}

      {step !== "enable" && (
        <StatusMessage status={enabled ? "success" : "skip"}>
          DO Spaces: {enabled ? "Enabled" : "Skipped"}
        </StatusMessage>
      )}

      {step === "endpoint" && (
        <TextInput
          label="Spaces Endpoint"
          value={endpoint}
          onChange={setEndpoint}
          onSubmit={handleEndpointSubmit}
          placeholder="https://nyc3.digitaloceanspaces.com"
        />
      )}

      {(step === "bucket" || step === "keyId" || step === "secretKey" || step === "region" || step === "done") &&
        enabled &&
        endpoint && <StatusMessage status="success">Endpoint: {endpoint}</StatusMessage>}

      {step === "bucket" && (
        <TextInput
          label="Bucket Name"
          value={bucket}
          onChange={setBucket}
          onSubmit={handleBucketSubmit}
          placeholder="my-bucket"
        />
      )}

      {(step === "keyId" || step === "secretKey" || step === "region" || step === "done") &&
        enabled &&
        bucket && <StatusMessage status="success">Bucket: {bucket}</StatusMessage>}

      {step === "keyId" && (
        <TextInput
          label="Access Key ID"
          value={accessKeyId}
          onChange={setAccessKeyId}
          onSubmit={handleKeyIdSubmit}
          placeholder="DO00..."
        />
      )}

      {(step === "secretKey" || step === "region" || step === "done") &&
        enabled &&
        accessKeyId && <StatusMessage status="success">Access Key ID configured</StatusMessage>}

      {step === "secretKey" && (
        <TextInput
          label="Secret Access Key"
          value={secretAccessKey}
          onChange={setSecretAccessKey}
          onSubmit={handleSecretKeySubmit}
          placeholder="..."
          mask="*"
        />
      )}

      {(step === "region" || step === "done") && enabled && secretAccessKey && (
        <StatusMessage status="success">Secret Access Key configured</StatusMessage>
      )}

      {step === "region" && (
        <TextInput
          label="Region"
          value={region}
          onChange={setRegion}
          onSubmit={handleRegionSubmit}
          placeholder="nyc3"
        />
      )}

      {step === "done" && enabled && region && <StatusMessage status="success">Region: {region}</StatusMessage>}
    </Box>
  );
};
