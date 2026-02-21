import { Box, Text, useApp } from "ink";
import React, { useState, useEffect, useRef } from "react";
import {
  Select,
  Spinner,
  SectionHeader,
  StatusMessage,
} from "../components/index.js";
import { listSpecs, moveSpec } from "../lib/specs.js";
import { loadTemplate, resolveTemplate, buildTemplateVars } from "../lib/template.js";
import { runClaude } from "../lib/claude-runner.js";
import type { ClaudeRunner } from "../lib/claude-runner.js";

type BuildStep = "selecting" | "running" | "summary" | "error";

export interface BuildCommandProps {
  spec?: string;
  iterations: number;
  verbose: boolean;
  specsDir: string;
  promptFile: string;
}

export const BuildCommand = ({
  spec,
  iterations,
  verbose,
  specsDir,
  promptFile,
}: BuildCommandProps) => {
  const { exit } = useApp();
  const [step, setStep] = useState<BuildStep>(spec ? "running" : "selecting");
  const [specName, setSpecName] = useState(spec ?? "");
  const [specPath, setSpecPath] = useState("");
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>([]);
  const [currentIteration, setCurrentIteration] = useState(1);
  const [sentinelDetected, setSentinelDetected] = useState(false);
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isLoadingSpecsRef = useRef(false);
  const isRunningRef = useRef(false);
  const runnerRef = useRef<ClaudeRunner | null>(null);

  // Load specs for selection
  useEffect(() => {
    if (step !== "selecting" || isLoadingSpecsRef.current) return;
    isLoadingSpecsRef.current = true;

    const load = async () => {
      const found = await listSpecs(specsDir);
      if (found.length === 0) {
        setError(
          `No planned specs found in ${specsDir}. Run eni plan first.`,
        );
        setStep("error");
        isLoadingSpecsRef.current = false;
        return;
      }
      setSpecs(found.map((s) => ({ label: s.name, value: s.name })));
      isLoadingSpecsRef.current = false;
    };
    void load();
  }, [step, specsDir]);

  // Resolve spec path when specName is set and we move to running
  useEffect(() => {
    if (step !== "running" || !specName || specPath) return;

    const resolve = async () => {
      const found = await listSpecs(specsDir);
      const match = found.find((s) => s.name === specName);
      if (!match) {
        setError(`Spec not found: ${specName}`);
        setStep("error");
        return;
      }
      setSpecPath(match.path);
    };
    void resolve();
  }, [step, specName, specPath, specsDir]);

  // Run iteration loop
  useEffect(() => {
    if (step !== "running" || !specPath || isRunningRef.current) return;
    isRunningRef.current = true;

    const runLoop = async () => {
      let template: string;
      try {
        template = await loadTemplate(promptFile);
      } catch {
        setError(`Prompt file not found: ${promptFile}`);
        setStep("error");
        isRunningRef.current = false;
        return;
      }

      let detectedSentinel = false;

      for (let i = currentIteration; i <= iterations; i++) {
        setCurrentIteration(i);
        setOutputLines([]);

        const vars = buildTemplateVars(specName, i, "build");
        const prompt = resolveTemplate(template, vars);

        const runner = runClaude(prompt, {
          onText: (text) => {
            setOutputLines((prev) => [...prev, text]);
          },
          onToolUse: verbose
            ? (toolName) => {
                setOutputLines((prev) => [
                  ...prev,
                  `[tool] ${toolName}`,
                ]);
              }
            : undefined,
        });
        runnerRef.current = runner;

        try {
          const result = await runner.result;

          if (result.sentinelDetected) {
            detectedSentinel = true;
            break;
          }

          if (result.exitCode !== 0) {
            setError(`Claude exited with code ${result.exitCode}`);
            setStep("error");
            isRunningRef.current = false;
            return;
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
          setStep("error");
          isRunningRef.current = false;
          return;
        }
      }

      setSentinelDetected(detectedSentinel);

      // Only archive the spec when sentinel was detected
      if (detectedSentinel) {
        const archiveDir = specsDir.replace(/\/planned\/?$/, "/archive");
        await moveSpec(specPath, archiveDir);
      }

      setStep("summary");
      isRunningRef.current = false;
    };
    void runLoop();
  }, [step, specPath, specName, iterations, currentIteration, promptFile, verbose]);

  // Exit on terminal states
  useEffect(() => {
    if (step === "summary" || step === "error") {
      const timer = setTimeout(() => exit(), 0);
      return () => clearTimeout(timer);
    }
  }, [step, exit]);

  // Kill Claude on Ctrl+C
  useEffect(() => {
    const handler = () => {
      runnerRef.current?.kill();
    };
    process.on("SIGINT", handler);
    return () => {
      process.off("SIGINT", handler);
    };
  }, []);

  const handleSpecSelect = (value: string) => {
    setSpecName(value);
    setStep("running");
  };

  return (
    <Box flexDirection="column">
      <SectionHeader title="Build" />

      {step === "selecting" && specs.length > 0 && (
        <Select
          label="Select a spec to build:"
          options={specs}
          onSelect={handleSpecSelect}
        />
      )}

      {step === "selecting" && specs.length === 0 && !error && (
        <Spinner label="Loading specs..." />
      )}

      {step === "running" && (
        <Box flexDirection="column">
          <Spinner label={`Iteration ${currentIteration}/${iterations}`} />
          {outputLines.length > 0 && (
            <Box flexDirection="column" marginLeft={2} marginTop={1}>
              {outputLines.slice(-20).map((line, i) => (
                <Text
                  key={i}
                  dimColor={line.startsWith("[tool]")}
                >
                  {line}
                </Text>
              ))}
            </Box>
          )}
        </Box>
      )}

      {step === "summary" && (
        <Box flexDirection="column">
          <StatusMessage status="success">
            {sentinelDetected
              ? "Build complete — spec archived."
              : `Completed ${iterations}/${iterations} iterations. Some tasks may remain — spec stays in planned.`}
          </StatusMessage>
          <Box marginTop={1} marginLeft={2}>
            <Text dimColor>
              {sentinelDetected
                ? `Completed in ${currentIteration}/${iterations} iterations (early exit).`
                : `All ${iterations} iterations used.`}
            </Text>
          </Box>
        </Box>
      )}

      {step === "error" && (
        <StatusMessage status="error">{error}</StatusMessage>
      )}
    </Box>
  );
};
