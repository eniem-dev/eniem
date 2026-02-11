import { Box, Text, useInput } from "ink";
import React, { useState } from "react";

interface ConfirmProps {
  label: string;
  onConfirm: (confirmed: boolean) => void;
  defaultValue?: boolean;
}

export const Confirm = ({
  label,
  onConfirm,
  defaultValue = false,
}: ConfirmProps) => {
  const [value, setValue] = useState(defaultValue);

  useInput((input, key) => {
    if (input === "y" || input === "Y") {
      setValue(true);
      onConfirm(true);
    } else if (input === "n" || input === "N") {
      setValue(false);
      onConfirm(false);
    } else if (key.return) {
      onConfirm(value);
    } else if (key.leftArrow || key.rightArrow) {
      setValue(!value);
    }
  });

  return (
    <Box>
      <Text bold color="blue">
        {label}{" "}
      </Text>
      <Text color={value ? "green" : "gray"}>[{value ? "Y" : "y"}]es</Text>
      <Text> / </Text>
      <Text color={!value ? "red" : "gray"}>[{!value ? "N" : "n"}]o</Text>
    </Box>
  );
};
