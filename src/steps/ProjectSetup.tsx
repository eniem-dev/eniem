import { Box, Text } from "ink";
import React, { useState } from "react";
import { TextInput, SectionHeader, StatusMessage } from "../components/index.js";
import { validate, projectNameSchema, optionalUrlSchema } from "../lib/validation.js";

interface ProjectConfig {
  name: string;
  url: string;
  secret: string;
}

interface ProjectSetupProps {
  initialName?: string;
  onComplete: (config: ProjectConfig) => void;
}

type Step = "name" | "url" | "secret" | "done";

export const ProjectSetup = ({ initialName, onComplete }: ProjectSetupProps) => {
  const [step, setStep] = useState<Step>(initialName ? "url" : "name");
  const [name, setName] = useState(initialName ?? "");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [urlError, setUrlError] = useState<string | undefined>();

  const handleNameSubmit = (value: string) => {
    const trimmed = value.trim();
    const result = validate(projectNameSchema, trimmed);
    if (result.success) {
      setNameError(undefined);
      setName(trimmed);
      setStep("url");
    } else {
      setNameError(result.error);
    }
  };

  const handleUrlSubmit = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === "") {
      // Empty URL is allowed, will use default
      setUrlError(undefined);
      setUrl(trimmed);
      setStep("secret");
    } else {
      const result = validate(optionalUrlSchema, trimmed);
      if (result.success) {
        setUrlError(undefined);
        setUrl(trimmed);
        setStep("secret");
      } else {
        setUrlError(result.error);
      }
    }
  };

  const handleSecretSubmit = (value: string) => {
    setSecret(value.trim());
    setStep("done");
    onComplete({ name, url: url || `https://${name}.example.com`, secret: value.trim() });
  };

  return (
    <Box flexDirection="column">
      <SectionHeader title="Project Configuration" />

      {step === "name" && (
        <TextInput
          label="Project name"
          value={name}
          onChange={(v) => { setName(v); setNameError(undefined); }}
          onSubmit={handleNameSubmit}
          placeholder="my-eniem-app"
          error={nameError}
        />
      )}

      {step !== "name" && (
        <StatusMessage status="success">Name: {name}</StatusMessage>
      )}

      {step === "url" && (
        <TextInput
          label="Project URL"
          value={url}
          onChange={(v) => { setUrl(v); setUrlError(undefined); }}
          onSubmit={handleUrlSubmit}
          placeholder={`https://${name}.example.com`}
          error={urlError}
        />
      )}

      {(step === "secret" || step === "done") && url && (
        <StatusMessage status="success">URL: {url}</StatusMessage>
      )}

      {step === "secret" && (
        <Box flexDirection="column">
          <TextInput
            label="Auth secret (leave empty to auto-generate)"
            value={secret}
            onChange={setSecret}
            onSubmit={handleSecretSubmit}
            placeholder="Press enter to auto-generate"
          />
        </Box>
      )}

      {step === "done" && (
        <StatusMessage status="success">Secret: {secret ? "***" : "(auto-generated)"}</StatusMessage>
      )}
    </Box>
  );
};
