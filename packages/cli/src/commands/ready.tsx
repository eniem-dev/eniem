import { Box, Text } from "ink";
import React, { useState, useEffect, useRef } from "react";
import { writeFile } from "fs/promises";
import { access, constants } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import clipboard from "clipboardy";
import {
  TextInput,
  Spinner,
  SectionHeader,
  StatusMessage,
  MultiSelect,
  Select,
  Confirm,
} from "../components/index.js";
import {
  REQUIRED_VARS,
  OPTIONAL_GROUPS,
  AUTO_SET_VARS,
  parseEnvFile,
  generateProductionEnv,
  getPreCheckedGroups,
  type EnvReadyConfig,
  type GroupVar,
} from "../lib/env-ready.js";

interface VarToPrompt extends GroupVar {
  groupName: string;
}

/**
 * Builds a flat list of all optional-group vars to prompt.
 * For analytics, only includes vars for the chosen provider (or nothing for "none").
 */
function computeVarsToPrompt(
  selected: string[],
  provider: string | null,
): VarToPrompt[] {
  const vars: VarToPrompt[] = [];
  for (const groupId of selected) {
    const group = OPTIONAL_GROUPS.find((g) => g.id === groupId);
    if (!group) continue;

    if (group.subSelection) {
      if (!provider || provider === "none") continue;
      const option = group.subSelection.options.find(
        (o) => o.value === provider,
      );
      if (option) {
        for (const v of option.vars) {
          vars.push({ ...v, groupName: group.name });
        }
      }
    } else {
      for (const v of group.vars) {
        vars.push({ ...v, groupName: group.name });
      }
    }
  }
  return vars;
}

type ReadyStep =
  | "preflight"
  | "required_vars"
  | "groups_select"
  | "analytics_provider"
  | "group_vars"
  | "output_choice"
  | "overwrite_confirm"
  | "output"
  | "summary"
  | "complete"
  | "aborted"
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

  // Group variable prompts
  const [optionalValues, setOptionalValues] = useState<Record<string, string>>(
    {},
  );
  const [groupVarsToPrompt, setGroupVarsToPrompt] = useState<VarToPrompt[]>(
    [],
  );
  const [currentGroupVarIndex, setCurrentGroupVarIndex] = useState(0);

  // Output method (file vs clipboard)
  const [outputMethod, setOutputMethod] = useState<"file" | "clipboard">("file");
  const [generatedContent, setGeneratedContent] = useState("");
  const [clipboardFailed, setClipboardFailed] = useState(false);

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

  // Step 3: Output — write file or copy to clipboard
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
          optional: optionalValues,
          autoSet,
          selectedGroups,
          skippedGroups,
        };

        const content = generateProductionEnv(config);

        if (outputMethod === "clipboard") {
          try {
            await clipboard.write(content);
            setStep("summary");
          } catch {
            setGeneratedContent(content);
            setClipboardFailed(true);
            setStep("summary");
          }
        } else {
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
        }
        isOutputRef.current = false;
      };
      writeOutput();
    }
  }, [step, projectDir, requiredValues, optionalValues, selectedGroups, skippedGroups, outputMethod]);

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

    if (selected.includes("analytics")) {
      setStep("analytics_provider");
    } else {
      const vars = computeVarsToPrompt(selected, null);
      if (vars.length > 0) {
        setGroupVarsToPrompt(vars);
        setCurrentGroupVarIndex(0);
        setInputValue(existingEnv[vars[0].key] ?? "");
        setStep("group_vars");
      } else {
        setStep("output_choice");
      }
    }
  };

  // Handle analytics provider sub-selection
  const handleAnalyticsProviderSelect = (value: string) => {
    if (value === "none") {
      // Treat analytics as skipped
      const updatedSelected = selectedGroups.filter((id) => id !== "analytics");
      const updatedSkipped = [...skippedGroups, "analytics"];
      setSelectedGroups(updatedSelected);
      setSkippedGroups(updatedSkipped);

      const vars = computeVarsToPrompt(updatedSelected, null);
      if (vars.length > 0) {
        setGroupVarsToPrompt(vars);
        setCurrentGroupVarIndex(0);
        setInputValue(existingEnv[vars[0].key] ?? "");
        setStep("group_vars");
      } else {
        setStep("output_choice");
      }
    } else {
      // Auto-set NEXT_PUBLIC_ANALYTICS_PROVIDER
      const analyticsGroup = OPTIONAL_GROUPS.find((g) => g.id === "analytics");
      const option = analyticsGroup?.subSelection?.options.find(
        (o) => o.value === value,
      );
      if (option?.autoSet) {
        setOptionalValues((prev) => ({ ...prev, ...option.autoSet }));
      }

      const vars = computeVarsToPrompt(selectedGroups, value);
      if (vars.length > 0) {
        setGroupVarsToPrompt(vars);
        setCurrentGroupVarIndex(0);
        setInputValue(existingEnv[vars[0].key] ?? "");
        setStep("group_vars");
      } else {
        setStep("output_choice");
      }
    }
  };

  // Handle group variable submission
  const handleGroupVarSubmit = (value: string) => {
    const trimmed = value.trim();
    const currentGroupVar = groupVarsToPrompt[currentGroupVarIndex];
    if (!currentGroupVar) return;

    setOptionalValues((prev) => ({ ...prev, [currentGroupVar.key]: trimmed }));

    const nextIndex = currentGroupVarIndex + 1;
    if (nextIndex < groupVarsToPrompt.length) {
      setCurrentGroupVarIndex(nextIndex);
      const nextVar = groupVarsToPrompt[nextIndex];
      setInputValue(nextVar ? (existingEnv[nextVar.key] ?? "") : "");
    } else {
      setInputValue("");
      setStep("output_choice");
    }
  };

  // Handle output destination selection
  const handleOutputChoice = (value: string) => {
    if (value === "clipboard") {
      setOutputMethod("clipboard");
      setStep("output");
    } else {
      setOutputMethod("file");
      const outputPath = join(projectDir, ".env.production");
      if (existsSync(outputPath)) {
        setStep("overwrite_confirm");
      } else {
        setStep("output");
      }
    }
  };

  // Handle overwrite confirmation
  const handleOverwriteConfirm = (confirmed: boolean) => {
    if (confirmed) {
      setStep("output");
    } else {
      setStep("aborted");
    }
  };

  // Build analytics provider options — existing provider first
  const getAnalyticsProviderOptions = () => {
    const analyticsGroup = OPTIONAL_GROUPS.find((g) => g.id === "analytics");
    if (!analyticsGroup?.subSelection) return [];

    const options = analyticsGroup.subSelection.options.map((o) => ({
      label: o.label,
      value: o.value,
    }));
    options.push({ label: "None", value: "none" });

    const existingProvider = existingEnv["NEXT_PUBLIC_ANALYTICS_PROVIDER"];
    if (existingProvider) {
      const idx = options.findIndex((o) => o.value === existingProvider);
      if (idx > 0) {
        const [item] = options.splice(idx, 1);
        options.unshift(item);
      }
    }

    return options;
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

      {step === "analytics_provider" && (
        <Box flexDirection="column" marginTop={1}>
          <Select
            label="Which analytics provider?"
            options={getAnalyticsProviderOptions()}
            onSelect={handleAnalyticsProviderSelect}
          />
        </Box>
      )}

      {step === "group_vars" && groupVarsToPrompt[currentGroupVarIndex] && (
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>
            ({currentGroupVarIndex + 1}/{groupVarsToPrompt.length}){" "}
            {groupVarsToPrompt[currentGroupVarIndex].groupName}
          </Text>
          <TextInput
            label={groupVarsToPrompt[currentGroupVarIndex].promptLabel}
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleGroupVarSubmit}
            placeholder={groupVarsToPrompt[currentGroupVarIndex].key}
          />
        </Box>
      )}

      {step === "output_choice" && (
        <Box flexDirection="column" marginTop={1}>
          <Select
            label="Where should the production env be saved?"
            options={[
              { label: ".env.production file", value: "file" },
              { label: "Copy to clipboard", value: "clipboard" },
            ]}
            onSelect={handleOutputChoice}
          />
        </Box>
      )}

      {step === "overwrite_confirm" && (
        <Box flexDirection="column" marginTop={1}>
          <Confirm
            label="Found existing .env.production. Overwrite?"
            onConfirm={handleOverwriteConfirm}
            defaultValue={false}
          />
        </Box>
      )}

      {step === "output" && (
        <Spinner
          label={
            outputMethod === "clipboard"
              ? "Copying to clipboard..."
              : "Writing .env.production..."
          }
        />
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

          {clipboardFailed ? (
            <Box flexDirection="column" marginTop={1}>
              <StatusMessage status="skip">
                Failed to copy to clipboard. Outputting to stdout instead:
              </StatusMessage>
              <Box marginTop={1}>
                <Text>{generatedContent}</Text>
              </Box>
            </Box>
          ) : (
            <Box marginTop={1}>
              <Text dimColor>
                Output:{" "}
                <Text color="cyan">
                  {outputMethod === "clipboard"
                    ? "Copied to clipboard"
                    : ".env.production"}
                </Text>
              </Text>
            </Box>
          )}
        </Box>
      )}

      {step === "aborted" && (
        <Box flexDirection="column" marginTop={1}>
          <StatusMessage status="skip">
            Aborted. No changes made.
          </StatusMessage>
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
