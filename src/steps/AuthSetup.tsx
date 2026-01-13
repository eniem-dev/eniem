import { Box, Text } from "ink";
import React, { useState } from "react";
import { Confirm, TextInput } from "../components/index.js";

interface AuthConfig {
  enabled: boolean;
  databaseUrl?: string;
}

interface AuthSetupProps {
  onComplete: (config: AuthConfig) => void;
}

type Step = "enable" | "database" | "done";

export const AuthSetup = ({ onComplete }: AuthSetupProps) => {
  const [step, setStep] = useState<Step>("enable");
  const [enabled, setEnabled] = useState(false);
  const [databaseUrl, setDatabaseUrl] = useState("");

  const handleEnableConfirm = (confirmed: boolean) => {
    setEnabled(confirmed);
    if (confirmed) {
      setStep("database");
    } else {
      setStep("done");
      onComplete({ enabled: false });
    }
  };

  const handleDatabaseSubmit = (value: string) => {
    setDatabaseUrl(value.trim());
    setStep("done");
    onComplete({ enabled: true, databaseUrl: value.trim() });
  };

  return (
    <Box flexDirection="column">
      <Text bold color="magenta">
        Authentication (BetterAuth)
      </Text>

      {step === "enable" && (
        <Confirm
          label="Enable BetterAuth?"
          onConfirm={handleEnableConfirm}
          defaultValue={true}
        />
      )}

      {step !== "enable" && (
        <Text color={enabled ? "green" : "yellow"}>
          {enabled ? "✓" : "○"} BetterAuth: {enabled ? "Enabled" : "Skipped"}
        </Text>
      )}

      {step === "database" && (
        <TextInput
          label="Database URL"
          value={databaseUrl}
          onChange={setDatabaseUrl}
          onSubmit={handleDatabaseSubmit}
          placeholder="postgresql://user:pass@localhost:5432/db"
        />
      )}

      {step === "done" && enabled && databaseUrl && (
        <Text color="green">✓ Database: {databaseUrl.replace(/:[^:@]+@/, ":***@")}</Text>
      )}
    </Box>
  );
};
