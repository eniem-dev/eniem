import { Box, Text, useInput } from "ink";
import React, { useState, useRef } from "react";

interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  label: string;
  items: MultiSelectOption[];
  onSubmit: (selectedValues: string[]) => void;
  initialSelected?: string[];
  required?: boolean;
  emptyHintText?: string;
}

const SELECT_ALL_VALUE = "__select_all__";

export const MultiSelect = ({
  label,
  items,
  onSubmit,
  initialSelected = [],
  required = false,
  emptyHintText = "Select at least one item",
}: MultiSelectProps) => {
  const allItems: MultiSelectOption[] = [
    { label: "Select all", value: SELECT_ALL_VALUE },
    ...items,
  ];

  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selectedValues, setSelectedValues] = useState<Set<string>>(
    new Set(initialSelected)
  );
  const [emptyHint, setEmptyHint] = useState(false);

  const highlightedIndexRef = useRef(highlightedIndex);
  highlightedIndexRef.current = highlightedIndex;

  const selectedValuesRef = useRef(selectedValues);
  selectedValuesRef.current = selectedValues;

  const allRealSelected = items.length > 0 && items.every((item) => selectedValues.has(item.value));

  useInput((input: string, key) => {
    if (key.upArrow || input === "k") {
      const next = highlightedIndexRef.current <= 0 ? allItems.length - 1 : highlightedIndexRef.current - 1;
      highlightedIndexRef.current = next;
      setHighlightedIndex(next);
      setEmptyHint(false);
    }

    if (key.downArrow || input === "j") {
      const next = highlightedIndexRef.current >= allItems.length - 1 ? 0 : highlightedIndexRef.current + 1;
      highlightedIndexRef.current = next;
      setHighlightedIndex(next);
      setEmptyHint(false);
    }

    if (input === " ") {
      const item = allItems[highlightedIndexRef.current];
      if (item) {
        if (item.value === SELECT_ALL_VALUE) {
          setSelectedValues((prev) => {
            const allCurrentlySelected = items.every((i) => prev.has(i.value));
            let next: Set<string>;
            if (allCurrentlySelected) {
              next = new Set();
            } else {
              next = new Set(prev);
              for (const i of items) {
                next.add(i.value);
              }
            }
            selectedValuesRef.current = next;
            return next;
          });
        } else {
          setSelectedValues((prev) => {
            const next = new Set(prev);
            if (next.has(item.value)) {
              next.delete(item.value);
            } else {
              next.add(item.value);
            }
            selectedValuesRef.current = next;
            return next;
          });
        }
        setEmptyHint(false);
      }
    }

    if (key.return) {
      const realSelected = Array.from(selectedValuesRef.current).filter(
        (v) => v !== SELECT_ALL_VALUE
      );
      if (required && realSelected.length === 0) {
        setEmptyHint(true);
      } else {
        onSubmit(realSelected);
      }
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold color="blue">
        {label}
      </Text>
      <Text dimColor>
        (↑↓ navigate, space toggle, enter confirm)
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {allItems.map((item, index) => {
          const isHighlighted = index === highlightedIndex;
          const isSelected =
            item.value === SELECT_ALL_VALUE
              ? allRealSelected
              : selectedValues.has(item.value);
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
      {emptyHint && (
        <Box>
          <Text color="yellow">{emptyHintText}</Text>
        </Box>
      )}
    </Box>
  );
};
