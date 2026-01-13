import { Box, Text, useInput, useApp } from "ink";
import React, { useState } from "react";
import { StatusMessage } from "./StatusMessage.js";

interface ErrorRecoveryProps {
  error: string;
  onRetry: () => void;
  context?: string;
}

export const ErrorRecovery = ({ error, onRetry, context }: ErrorRecoveryProps) => {
  const { exit } = useApp();
  const [selected, setSelected] = useState<"retry" | "exit">("retry");

  useInput((input, key) => {
    if (input === "r" || input === "R") {
      onRetry();
    } else if (input === "e" || input === "E" || input === "q" || input === "Q") {
      exit();
    } else if (key.return) {
      if (selected === "retry") {
        onRetry();
      } else {
        exit();
      }
    } else if (key.leftArrow || key.rightArrow || key.tab) {
      setSelected(selected === "retry" ? "exit" : "retry");
    }
  });

  return (
    <Box flexDirection="column" marginTop={1}>
      <StatusMessage status="error">{error}</StatusMessage>
      {context && (
        <Box marginLeft={2}>
          <Text dimColor>{context}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text bold>What would you like to do? </Text>
        <Text color={selected === "retry" ? "green" : "gray"}>
          [{selected === "retry" ? "R" : "r"}]etry
        </Text>
        <Text> / </Text>
        <Text color={selected === "exit" ? "red" : "gray"}>
          [{selected === "exit" ? "E" : "e"}]xit
        </Text>
      </Box>
    </Box>
  );
};
