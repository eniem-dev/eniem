import { Box, Text, useInput } from "ink";
import React, { useState, useCallback } from "react";

interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  label: string;
  items: MultiSelectOption[];
  onSubmit: (selectedValues: string[]) => void;
  initialSelected?: string[];
}

export const MultiSelect = ({
  label,
  items,
  onSubmit,
  initialSelected = [],
}: MultiSelectProps) => {
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selectedValues, setSelectedValues] = useState<Set<string>>(
    new Set(initialSelected)
  );

  useInput(
    useCallback(
      (input: string, key) => {
        if (key.upArrow || input === "k") {
          setHighlightedIndex((prev) =>
            prev <= 0 ? items.length - 1 : prev - 1
          );
        }

        if (key.downArrow || input === "j") {
          setHighlightedIndex((prev) =>
            prev >= items.length - 1 ? 0 : prev + 1
          );
        }

        if (input === " ") {
          const item = items[highlightedIndex];
          if (item) {
            setSelectedValues((prev) => {
              const next = new Set(prev);
              if (next.has(item.value)) {
                next.delete(item.value);
              } else {
                next.add(item.value);
              }
              return next;
            });
          }
        }

        if (key.return) {
          onSubmit(Array.from(selectedValues));
        }
      },
      [items, highlightedIndex, selectedValues, onSubmit]
    )
  );

  return (
    <Box flexDirection="column">
      <Text bold color="blue">
        {label}
      </Text>
      <Text dimColor>
        (↑↓ navigate, space toggle, enter confirm)
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {items.map((item, index) => {
          const isHighlighted = index === highlightedIndex;
          const isSelected = selectedValues.has(item.value);
          return (
            <Box key={item.value}>
              <Text color={isHighlighted ? "blue" : undefined}>
                {isHighlighted ? "❯ " : "  "}
              </Text>
              <Text color={isHighlighted ? "blue" : undefined}>
                {isSelected ? "◉ " : "○ "}
              </Text>
              <Text
                color={isHighlighted ? "blue" : undefined}
                bold={isHighlighted}
              >
                {item.label}
              </Text>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          Selected: {selectedValues.size} item{selectedValues.size !== 1 ? "s" : ""}
        </Text>
      </Box>
    </Box>
  );
};
