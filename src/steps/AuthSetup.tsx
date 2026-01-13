import { Box } from "ink";
import React, { useState } from "react";
import { TextInput, SectionHeader, StatusMessage } from "../components/index.js";
import { validate, databaseUrlSchema } from "../lib/validation.js";

interface AuthConfig {
  enabled: boolean;
  databaseUrl?: string;
}

interface AuthSetupProps {
  onComplete: (config: AuthConfig) => void;
}

type Step = "database" | "done";

export const AuthSetup = ({ onComplete }: AuthSetupProps) => {
  const [step, setStep] = useState<Step>("database");
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [dbError, setDbError] = useState<string | undefined>();

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

      <StatusMessage status="success">
        BetterAuth: Enabled
      </StatusMessage>

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

      {step === "done" && databaseUrl && (
        <StatusMessage status="success">
          Database: {databaseUrl.replace(/:[^:@]+@/, ":***@")}
        </StatusMessage>
      )}
    </Box>
  );
};
