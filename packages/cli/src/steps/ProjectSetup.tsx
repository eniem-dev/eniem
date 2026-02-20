import { Box } from "ink";
import React, { useState } from "react";
import { TextInput, SectionHeader, StatusMessage } from "../components/index.js";
import { validate, projectNameSchema, requiredStringSchema } from "../lib/validation.js";
import { toTitleCase } from "../lib/string.js";

interface ProjectConfig {
  name: string;
  appName: string;
}

interface ProjectSetupProps {
  initialName?: string;
  initialAppName?: string;
  onComplete: (config: ProjectConfig) => void;
}

type Step = "name" | "appName" | "done";

function getInitialStep(initialName?: string, initialAppName?: string): Step {
  if (initialName && initialAppName) return "done";
  if (initialName) return "appName";
  return "name";
}

export const ProjectSetup = ({ initialName, initialAppName, onComplete }: ProjectSetupProps) => {
  const [step, setStep] = useState<Step>(() => getInitialStep(initialName, initialAppName));
  const [name, setName] = useState(initialName ?? "");
  const [nameError, setNameError] = useState<string | undefined>();
  const [appName, setAppName] = useState(initialAppName ?? (initialName ? toTitleCase(initialName) : ""));
  const [appNameError, setAppNameError] = useState<string | undefined>();

  // If both initialName and initialAppName are provided, complete immediately
  React.useEffect(() => {
    if (initialName && initialAppName && step === "done") {
      onComplete({ name: initialName, appName: initialAppName });
    }
  }, []);

  const handleNameSubmit = (value: string) => {
    const trimmed = value.trim();
    const result = validate(projectNameSchema, trimmed);
    if (result.success) {
      setNameError(undefined);
      setName(trimmed);
      setAppName(toTitleCase(trimmed));
      setStep("appName");
    } else {
      setNameError(result.error);
    }
  };

  const handleAppNameSubmit = (value: string) => {
    const trimmed = value.trim();
    const result = validate(requiredStringSchema, trimmed);
    if (result.success) {
      setAppNameError(undefined);
      setAppName(trimmed);
      setStep("done");
      onComplete({ name, appName: trimmed });
    } else {
      setAppNameError(result.error);
    }
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

      {step === "appName" && (
        <>
          <StatusMessage status="success">Name: {name}</StatusMessage>
          <TextInput
            label="App name"
            value={appName}
            onChange={(v) => { setAppName(v); setAppNameError(undefined); }}
            onSubmit={handleAppNameSubmit}
            error={appNameError}
          />
        </>
      )}

      {step === "done" && (
        <>
          <StatusMessage status="success">Name: {name}</StatusMessage>
          <StatusMessage status="success">App name: {appName}</StatusMessage>
        </>
      )}
    </Box>
  );
};
