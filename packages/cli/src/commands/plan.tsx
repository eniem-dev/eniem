import { Box, Text, Static, useApp } from "ink";
import React, { useState, useEffect, useRef } from "react";
import { join } from "path";
import {
  Select,
  Spinner,
  SectionHeader,
  StatusMessage,
} from "../components/index.js";
import { listSpecs, moveSpec } from "../lib/specs.js";
import { loadTemplate, resolveTemplate, buildTemplateVars } from "../lib/template.js";
import { runClaude, checkBinary } from "../lib/claude-runner.js";
import type { ClaudeRunner } from "../lib/claude-runner.js";

function toolInputSummary(name: string, input: Record<string, unknown>): string {
  const s = (k: string) => (typeof input[k] === "string" ? (input[k] as string) : "");
  if (name === "Read" || name === "Edit" || name === "Write") return s("file_path");
  if (name === "Bash") return s("command").slice(0, 80);
  if (name === "Glob") return s("pattern");
  if (name === "Grep") return s("pattern");
  if (name === "Task") return s("description");
  if (name === "WebFetch") return s("url");
  if (name === "WebSearch") return s("query");
  return "";
}

type PlanStep = "selecting" | "running" | "summary" | "error";

export interface PlanCommandProps {
  spec?: string;
  iterations: number;
  verbose: boolean;
  specsDir: string;
  promptFile: string;
}

export const PlanCommand = ({
  spec,
  iterations,
  verbose,
  specsDir,
  promptFile,
}: PlanCommandProps) => {
  const { exit } = useApp();
  const [step, setStep] = useState<PlanStep>(spec ? "running" : "selecting");
  const [specName, setSpecName] = useState(spec ?? "");
  const [specPath, setSpecPath] = useState("");
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>([]);
  const [currentIteration, setCurrentIteration] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [sentinelDetected, setSentinelDetected] = useState(false);
  const [pastLines, setPastLines] = useState<string[]>([]);
  const [currentLines, setCurrentLines] = useState<string[]>([]);
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
        setError(`No unplanned specs found in ${specsDir}. Create a spec file first.`);
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
        setError(`Spec not found: ${join(specsDir, specName + ".md")}`);
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
      // Lazy prerequisite checks
      if (!(await checkBinary("bd"))) {
        setError("Beads CLI not found. Install it with: npm install -g @beads-cli/bd");
        setStep("error");
        isRunningRef.current = false;
        return;
      }

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
        if (i > 1) {
          setCurrentLines((prev) => {
            setPastLines((past) => [...past, `── Iteration ${i - 1} ──`, ...prev]);
            return [];
          });
        }

        const vars = buildTemplateVars(specName, i, "plan");
        const prompt = resolveTemplate(template, vars);

        const runner = runClaude(prompt, {
          onText: (text) => {
            setCurrentLines((prev) => [...prev, text]);
          },
          onToolUse: verbose
            ? (toolName, toolInput) => {
                const detail = toolInputSummary(toolName, toolInput);
                setCurrentLines((prev) => [
                  ...prev,
                  detail ? `[tool] ${toolName}: ${detail}` : `[tool] ${toolName}`,
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

      // Move spec to planned
      setSentinelDetected(detectedSentinel);
      const plannedDir = join(specsDir, "planned");
      await moveSpec(specPath, plannedDir);

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

  // Elapsed time ticker
  useEffect(() => {
    if (step !== "running") return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [step]);

  // Kill Claude on Ctrl+C and exit with code 130
  useEffect(() => {
    const handler = () => {
      runnerRef.current?.kill();
      process.exit(130);
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
      <SectionHeader title="Plan" />

      {step === "selecting" && specs.length > 0 && (
        <Select
          label="Select a spec to plan:"
          options={specs}
          onSelect={handleSpecSelect}
        />
      )}

      {step === "selecting" && specs.length === 0 && !error && (
        <Spinner label="Loading specs..." />
      )}

      {step === "running" && (
        <Box flexDirection="column">
          <Static items={pastLines}>
            {(line, i) => (
              <Text key={i} dimColor={line.startsWith("[tool]") || line.startsWith("──")}>
                {line}
              </Text>
            )}
          </Static>
          {currentLines.length > 0 && (
            <Box flexDirection="column" marginLeft={2}>
              {currentLines.slice(-20).map((line, i) => (
                <Text key={i} dimColor={line.startsWith("[tool]")}>{line}</Text>
              ))}
            </Box>
          )}
          <Spinner label={`Iteration ${currentIteration}/${iterations} (${elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m${String(elapsed % 60).padStart(2, "0")}s`})`} />
        </Box>
      )}

      {step === "summary" && (
        <Box flexDirection="column">
          <StatusMessage status="success">
            Plan complete — spec moved to planned.
          </StatusMessage>
          <Box marginTop={1} marginLeft={2}>
            <Text dimColor>
              {sentinelDetected
                ? `Completed in ${currentIteration}/${iterations} iterations (early exit).`
                : `Completed ${iterations}/${iterations} iterations.`}
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
