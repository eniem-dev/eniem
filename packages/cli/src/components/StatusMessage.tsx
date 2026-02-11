import { Text } from "ink";
import React from "react";

type Status = "success" | "error" | "skip" | "info";

interface StatusMessageProps {
  status: Status;
  children: React.ReactNode;
}

const statusConfig: Record<Status, { color: string; prefix: string }> = {
  success: { color: "green", prefix: "✓" },
  error: { color: "red", prefix: "✗" },
  skip: { color: "yellow", prefix: "○" },
  info: { color: "cyan", prefix: "→" },
};

export const StatusMessage = ({ status, children }: StatusMessageProps) => {
  const { color, prefix } = statusConfig[status];

  return (
    <Text color={color}>
      {prefix} {children}
    </Text>
  );
};
