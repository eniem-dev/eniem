import { Box, Text } from "ink";
import React, { useState } from "react";
import { Confirm, TextInput, SectionHeader, StatusMessage } from "../components/index.js";
import { validate, databaseUrlSchema } from "../lib/validation.js";

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
  const [dbError, setDbError] = useState<string | undefined>();

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
    const trimmed = value.trim();
    const result = validate(databaseUrlSchema, trimmed);
    if (result.success) {
      setDbError(undefined);
      setDatabaseUrl(trimmed);
      setStep("done");
      onComplete({ enabled: true, databaseUrl: trimmed });
    } else {
      setDbError(result.error);
    }
  };

  return (
    <Box flexDirection="column">
      <SectionHeader title="Authentication (BetterAuth)" />

      {step === "enable" && (
        <Confirm
          label="Enable BetterAuth?"
          onConfirm={handleEnableConfirm}
          defaultValue={true}
        />
      )}

      {step !== "enable" && (
        <StatusMessage status={enabled ? "success" : "skip"}>
          BetterAuth: {enabled ? "Enabled" : "Skipped"}
        </StatusMessage>
      )}

      {step === "database" && (
        <TextInput
          label="Database URL"
          value={databaseUrl}
          onChange={(v) => { setDatabaseUrl(v); setDbError(undefined); }}
          onSubmit={handleDatabaseSubmit}
          placeholder="postgresql://user:pass@localhost:5432/db"
          error={dbError}
        />
      )}

      {step === "done" && enabled && databaseUrl && (
        <StatusMessage status="success">
          Database: {databaseUrl.replace(/:[^:@]+@/, ":***@")}
        </StatusMessage>
      )}
    </Box>
  );
};
