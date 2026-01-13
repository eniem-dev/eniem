import { Box, Text } from "ink";
import React, { useState } from "react";
import { TextInput } from "../components/index.js";

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

  const handleNameSubmit = (value: string) => {
    if (value.trim()) {
      setName(value.trim());
      setStep("url");
    }
  };

  const handleUrlSubmit = (value: string) => {
    setUrl(value.trim());
    setStep("secret");
  };

  const handleSecretSubmit = (value: string) => {
    setSecret(value.trim());
    setStep("done");
    onComplete({ name, url: url || `https://${name}.example.com`, secret: value.trim() });
  };

  return (
    <Box flexDirection="column">
      <Text bold color="magenta">
        Project Configuration
      </Text>

      {step === "name" && (
        <TextInput
          label="Project name"
          value={name}
          onChange={setName}
          onSubmit={handleNameSubmit}
          placeholder="my-eniem-app"
        />
      )}

      {step !== "name" && (
        <Text color="green">✓ Name: {name}</Text>
      )}

      {step === "url" && (
        <TextInput
          label="Project URL"
          value={url}
          onChange={setUrl}
          onSubmit={handleUrlSubmit}
          placeholder={`https://${name}.example.com`}
        />
      )}

      {(step === "secret" || step === "done") && url && (
        <Text color="green">✓ URL: {url}</Text>
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
        <Text color="green">✓ Secret: {secret ? "***" : "(auto-generated)"}</Text>
      )}
    </Box>
  );
};
