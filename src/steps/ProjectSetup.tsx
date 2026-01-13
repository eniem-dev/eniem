import { Box } from "ink";
import React, { useState } from "react";
import { TextInput, SectionHeader, StatusMessage } from "../components/index.js";
import { validate, projectNameSchema } from "../lib/validation.js";

interface ProjectConfig {
  name: string;
}

interface ProjectSetupProps {
  initialName?: string;
  onComplete: (config: ProjectConfig) => void;
}

type Step = "name" | "done";

export const ProjectSetup = ({ initialName, onComplete }: ProjectSetupProps) => {
  const [step, setStep] = useState<Step>(initialName ? "done" : "name");
  const [name, setName] = useState(initialName ?? "");
  const [nameError, setNameError] = useState<string | undefined>();

  // If initialName is provided, complete immediately
  React.useEffect(() => {
    if (initialName && step === "done") {
      onComplete({ name: initialName });
    }
  }, []);

  const handleNameSubmit = (value: string) => {
    const trimmed = value.trim();
    const result = validate(projectNameSchema, trimmed);
    if (result.success) {
      setNameError(undefined);
      setName(trimmed);
      setStep("done");
      onComplete({ name: trimmed });
    } else {
      setNameError(result.error);
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

      {step === "done" && (
        <StatusMessage status="success">Name: {name}</StatusMessage>
      )}
    </Box>
  );
};
