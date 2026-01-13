import { Box, Text } from "ink";
import React, { useState } from "react";
import { Confirm, TextInput } from "../components/index.js";

interface StorageConfig {
  enabled: boolean;
  endpoint?: string;
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
}

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
    setEndpoint(value.trim());
    setStep("bucket");
  };

  const handleBucketSubmit = (value: string) => {
    setBucket(value.trim());
    setStep("keyId");
  };

  const handleKeyIdSubmit = (value: string) => {
    setAccessKeyId(value.trim());
    setStep("secretKey");
  };

  const handleSecretKeySubmit = (value: string) => {
    setSecretAccessKey(value.trim());
    setStep("region");
  };

  const handleRegionSubmit = (value: string) => {
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
      <Text bold color="magenta">
        Storage (DigitalOcean Spaces)
      </Text>

      {step === "enable" && (
        <Confirm label="Enable DO Spaces storage?" onConfirm={handleEnableConfirm} />
      )}

      {step !== "enable" && (
        <Text color={enabled ? "green" : "yellow"}>
          {enabled ? "✓" : "○"} DO Spaces: {enabled ? "Enabled" : "Skipped"}
        </Text>
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
        endpoint && <Text color="green">✓ Endpoint: {endpoint}</Text>}

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
        bucket && <Text color="green">✓ Bucket: {bucket}</Text>}

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
        accessKeyId && <Text color="green">✓ Access Key ID configured</Text>}

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
        <Text color="green">✓ Secret Access Key configured</Text>
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

      {step === "done" && enabled && region && <Text color="green">✓ Region: {region}</Text>}
    </Box>
  );
};
