import { Box, Text } from "ink";
import React, { useState, useEffect, useRef } from "react";
import { writeFile } from "fs/promises";
import { access, constants } from "fs/promises";
import { join } from "path";
import {
  TextInput,
  Spinner,
  SectionHeader,
  StatusMessage,
  MultiSelect,
} from "../components/index.js";
import {
  REQUIRED_VARS,
  OPTIONAL_GROUPS,
  AUTO_SET_VARS,
  parseEnvFile,
  generateProductionEnv,
  getPreCheckedGroups,
  type EnvReadyConfig,
} from "../lib/env-ready.js";

type ReadyStep =
  | "preflight"
  | "required_vars"
  | "groups_select"
  | "output"
  | "summary"
  | "complete"
  | "error";

interface ReadyCommandProps {
  projectDir: string;
}

export const ReadyCommand = ({ projectDir }: ReadyCommandProps) => {
  const [step, setStep] = useState<ReadyStep>("preflight");
  const [error, setError] = useState<string | null>(null);

  // Existing .env data
  const [existingEnv, setExistingEnv] = useState<Record<string, string>>({});
  const [hasExistingEnv, setHasExistingEnv] = useState(false);

  // Required vars collection — index tracks which var we're prompting
  const [requiredValues, setRequiredValues] = useState<Record<string, string>>(
    {},
  );
  const [currentVarIndex, setCurrentVarIndex] = useState(0);

  // Optional groups selection
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [skippedGroups, setSkippedGroups] = useState<string[]>([]);

  // Reusable input state
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | undefined>(undefined);

  // Refs to prevent duplicate effect runs
  const isPreflightRef = useRef(false);
  const isOutputRef = useRef(false);

  // Step 1: Preflight — check .env.example exists, parse existing .env
  useEffect(() => {
    if (step === "preflight" && !isPreflightRef.current) {
      isPreflightRef.current = true;
      const preflight = async () => {
        // Check .env.example exists
        const envExamplePath = join(projectDir, ".env.example");
        try {
          await access(envExamplePath, constants.R_OK);
        } catch {
          setError(
            "No .env.example found in current directory. Run this command from your project root.",
          );
          setStep("error");
          isPreflightRef.current = false;
          return;
        }

        // Check for existing .env and parse it
        const envPath = join(projectDir, ".env");
        try {
          await access(envPath, constants.R_OK);
          const parsed = await parseEnvFile(envPath);
          setExistingEnv(parsed);
          setHasExistingEnv(true);
        } catch {
          // No existing .env — that's fine
        }

        // Pre-fill first var's input from existing env
        const firstVar = REQUIRED_VARS[0];
        if (firstVar) {
          const existing = existingEnv[firstVar.key];
          if (existing) {
            setInputValue(existing);
          }
        }

        setStep("required_vars");
        isPreflightRef.current = false;
      };
      preflight();
    }
  }, [step, projectDir]);

  // Step 3: Output — write .env.production
  useEffect(() => {
    if (step === "output" && !isOutputRef.current) {
      isOutputRef.current = true;
      const writeOutput = async () => {
        // Build auto-set values
        const autoSet: Record<string, string> = {};
        for (const v of AUTO_SET_VARS) {
          if (v.value) {
            autoSet[v.key] = v.value;
          } else if (v.derivedFrom && requiredValues[v.derivedFrom]) {
            autoSet[v.key] = requiredValues[v.derivedFrom];
          }
        }

        const config: EnvReadyConfig = {
          required: requiredValues,
          optional: {},
          autoSet,
          selectedGroups,
          skippedGroups,
        };

        const content = generateProductionEnv(config);
        const outputPath = join(projectDir, ".env.production");

        try {
          await writeFile(outputPath, content, "utf-8");
          setStep("summary");
        } catch (err) {
          setError(
            `Failed to write .env.production: ${err instanceof Error ? err.message : String(err)}`,
          );
          setStep("error");
        }
        isOutputRef.current = false;
      };
      writeOutput();
    }
  }, [step, projectDir, requiredValues, selectedGroups, skippedGroups]);

  // Handle required var submission
  const handleVarSubmit = (value: string) => {
    const trimmed = value.trim();
    const currentVar = REQUIRED_VARS[currentVarIndex];

    if (!currentVar) return;

    if (!trimmed) {
      setInputError(`${currentVar.key} is required`);
      return;
    }

    // Save value
    const updated = { ...requiredValues, [currentVar.key]: trimmed };
    setRequiredValues(updated);
    setInputError(undefined);

    // Move to next var or finish
    const nextIndex = currentVarIndex + 1;
    if (nextIndex < REQUIRED_VARS.length) {
      setCurrentVarIndex(nextIndex);
      // Pre-fill next input from existing env
      const nextVar = REQUIRED_VARS[nextIndex];
      if (nextVar) {
        setInputValue(existingEnv[nextVar.key] ?? "");
      }
    } else {
      setInputValue("");
      setStep("groups_select");
    }
  };

  // Handle optional groups selection
  const handleGroupsSubmit = (selected: string[]) => {
    const allGroupIds = OPTIONAL_GROUPS.map((g) => g.id);
    const skipped = allGroupIds.filter((id) => !selected.includes(id));
    setSelectedGroups(selected);
    setSkippedGroups(skipped);
    setStep("output");
  };

  // Build auto-set display for summary
  const getAutoSetSummary = (): Array<{ key: string; value: string }> => {
    const result: Array<{ key: string; value: string }> = [];
    for (const v of AUTO_SET_VARS) {
      if (v.value) {
        result.push({ key: v.key, value: v.value });
      } else if (v.derivedFrom && requiredValues[v.derivedFrom]) {
        result.push({ key: v.key, value: requiredValues[v.derivedFrom] });
      }
    }
    return result;
  };

  const currentVar = REQUIRED_VARS[currentVarIndex];

  return (
    <Box flexDirection="column">
      <SectionHeader title="Production Environment Setup" />

      {step === "preflight" && (
        <Spinner label="Checking project files..." />
      )}

      {step === "preflight" || step === "required_vars" ? (
        <Box flexDirection="column">
          {hasExistingEnv ? (
            <StatusMessage status="info">
              Found .env — using existing values as defaults.
            </StatusMessage>
          ) : step === "required_vars" ? (
            <StatusMessage status="info">
              No existing .env found — starting fresh.
            </StatusMessage>
          ) : null}
        </Box>
      ) : null}

      {step === "required_vars" && currentVar && (
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>
            ({currentVarIndex + 1}/{REQUIRED_VARS.length}) Required variables
          </Text>
          {currentVar.notes && (
            <Text dimColor italic>
              {currentVar.notes}
            </Text>
          )}
          <TextInput
            label={currentVar.promptLabel}
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleVarSubmit}
            placeholder={currentVar.key}
            error={inputError}
          />
        </Box>
      )}

      {step === "groups_select" && (
        <Box flexDirection="column" marginTop={1}>
          <MultiSelect
            label="Optional feature groups (space to toggle, enter to confirm):"
            items={OPTIONAL_GROUPS.map((g) => ({
              label: g.label,
              value: g.id,
            }))}
            onSubmit={handleGroupsSubmit}
            initialSelected={getPreCheckedGroups(existingEnv)}
          />
        </Box>
      )}

      {step === "output" && (
        <Spinner label="Writing .env.production..." />
      )}

      {step === "summary" && (
        <Box flexDirection="column" marginTop={1}>
          <StatusMessage status="success">
            Production .env ready!
          </StatusMessage>

          <Box flexDirection="column" marginTop={1} marginLeft={2}>
            <Text bold>Configured:</Text>
            {REQUIRED_VARS.map((v) => (
              <Text key={v.key} color="green">
                - {v.key}
              </Text>
            ))}
          </Box>

          <Box flexDirection="column" marginTop={1} marginLeft={2}>
            <Text bold>Auto-set:</Text>
            {getAutoSetSummary().map(({ key, value }) => (
              <Text key={key} color="cyan">
                - {key} = {value}
              </Text>
            ))}
          </Box>

          <Box marginTop={1}>
            <Text dimColor>
              Output: <Text color="cyan">.env.production</Text>
            </Text>
          </Box>
        </Box>
      )}

      {step === "error" && (
        <Box flexDirection="column">
          <StatusMessage status="error">{error}</StatusMessage>
        </Box>
      )}
    </Box>
  );
};
