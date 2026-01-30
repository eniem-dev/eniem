import { Box, Text } from "ink";
import React, { useState, useEffect, useRef } from "react";
import {
  Spinner,
  Confirm,
  SectionHeader,
  StatusMessage,
} from "../components/index.js";
import {
  checkEniExists,
  sparseCloneBoilerplate,
  copyAiFiles,
  ensureSpecsFolder,
  cleanupTempDir,
} from "../lib/ai-init.js";

type AiInitStep =
  | "checking"
  | "confirm_update"
  | "cloning"
  | "copying"
  | "complete"
  | "error";

interface AiCommandProps {
  forceFlag: boolean;
  targetDir: string;
  gitHost: string;
}

export const AiCommand = ({ forceFlag, targetDir, gitHost }: AiCommandProps) => {
  const [step, setStep] = useState<AiInitStep>("checking");
  const [eniExists, setEniExists] = useState(false);
  const [copiedFiles, setCopiedFiles] = useState<string[]>([]);
  const [specsCreated, setSpecsCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempDir, setTempDir] = useState<string | null>(null);

  // Refs to prevent duplicate effect runs
  const isCheckingRef = useRef(false);
  const isCloningRef = useRef(false);
  const isCopyingRef = useRef(false);

  // Step 1: Check if .eni exists
  useEffect(() => {
    if (step === "checking" && !isCheckingRef.current) {
      isCheckingRef.current = true;
      const check = async () => {
        const exists = await checkEniExists(targetDir);
        setEniExists(exists);

        if (exists && !forceFlag) {
          setStep("confirm_update");
        } else {
          setStep("cloning");
        }
        isCheckingRef.current = false;
      };
      check();
    }
  }, [step, targetDir, forceFlag]);

  // Step 2: Sparse clone boilerplate
  useEffect(() => {
    if (step === "cloning" && !isCloningRef.current) {
      isCloningRef.current = true;
      const clone = async () => {
        const result = await sparseCloneBoilerplate(gitHost);
        if (!result.success) {
          setError(result.error ?? "Failed to clone boilerplate");
          setStep("error");
          isCloningRef.current = false;
          return;
        }
        setTempDir(result.tempDir);
        setStep("copying");
        isCloningRef.current = false;
      };
      clone();
    }
  }, [step, gitHost]);

  // Step 3: Copy files and ensure specs folder
  useEffect(() => {
    if (step === "copying" && tempDir && !isCopyingRef.current) {
      isCopyingRef.current = true;
      const copy = async () => {
        // Copy .eni and .claude folders
        const copyResult = await copyAiFiles(tempDir, targetDir);
        if (!copyResult.success) {
          await cleanupTempDir(tempDir);
          setError(copyResult.error ?? "Failed to copy files");
          setStep("error");
          isCopyingRef.current = false;
          return;
        }

        // Ensure specs folder exists
        const specsResult = await ensureSpecsFolder(targetDir);
        if (!specsResult.success) {
          await cleanupTempDir(tempDir);
          setError(specsResult.error ?? "Failed to create specs folder");
          setStep("error");
          isCopyingRef.current = false;
          return;
        }

        // Add specs/.gitkeep to copied files if specs folder was created
        const allCopiedFiles = [...copyResult.copiedFiles];
        if (specsResult.created) {
          allCopiedFiles.push("specs/.gitkeep");
        }

        // Cleanup temp directory
        await cleanupTempDir(tempDir);

        setCopiedFiles(allCopiedFiles);
        setSpecsCreated(specsResult.created);
        setStep("complete");
        isCopyingRef.current = false;
      };
      copy();
    }
  }, [step, tempDir, targetDir]);

  // Handle confirmation
  const handleConfirm = (confirmed: boolean) => {
    if (confirmed) {
      setStep("cloning");
    } else {
      process.exit(0);
    }
  };

  return (
    <Box flexDirection="column">
      <SectionHeader title="AI Workflow Setup" />

      {step === "checking" && <Spinner label="Checking existing files..." />}

      {step === "confirm_update" && (
        <Box flexDirection="column">
          <Text color="yellow">
            .eni folder already exists in this project.
          </Text>
          <Box marginTop={1}>
            <Confirm
              label="Update AI workflow files? This will replace existing .eni and .claude folders"
              onConfirm={handleConfirm}
              defaultValue={false}
            />
          </Box>
        </Box>
      )}

      {step === "cloning" && (
        <Spinner label="Fetching latest AI workflow files from boilerplate..." />
      )}

      {step === "copying" && <Spinner label="Copying files to project..." />}

      {step === "complete" && (
        <Box flexDirection="column">
          <StatusMessage status="success">
            {eniExists
              ? "AI workflow files updated!"
              : "AI workflow initialized!"}
          </StatusMessage>

          <Box flexDirection="column" marginTop={1} marginLeft={2}>
            <Text bold>Copied files:</Text>
            {copiedFiles.map((file) => (
              <Text key={file} color="green">
                - {file}
              </Text>
            ))}
          </Box>

          {specsCreated && (
            <Box marginTop={1}>
              <Text dimColor>Created specs/ folder for feature specs</Text>
            </Box>
          )}

          <Box marginTop={1}>
            <Text dimColor>
              Run <Text color="cyan">./loop.sh plan</Text> to start planning
              with AI
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
