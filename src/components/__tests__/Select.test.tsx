import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { Select } from "../Select.js";

describe("Select", () => {
  const options = [
    { label: "Option A", value: "a" },
    { label: "Option B", value: "b" },
    { label: "Option C", value: "c" },
  ];

  it("renders the label", () => {
    const { lastFrame } = render(
      <Select label="Choose option" options={options} onSelect={() => {}} />
    );
    expect(lastFrame()).toContain("Choose option");
  });

  it("renders all options", () => {
    const { lastFrame } = render(
      <Select label="Choose option" options={options} onSelect={() => {}} />
    );
    expect(lastFrame()).toContain("Option A");
    expect(lastFrame()).toContain("Option B");
    expect(lastFrame()).toContain("Option C");
  });

  it("renders with two options", () => {
    const twoOptions = [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ];
    const { lastFrame } = render(
      <Select label="Confirm?" options={twoOptions} onSelect={() => {}} />
    );
    expect(lastFrame()).toContain("Yes");
    expect(lastFrame()).toContain("No");
  });

  it("renders with single option", () => {
    const singleOption = [{ label: "Only Choice", value: "only" }];
    const { lastFrame } = render(
      <Select label="Pick one" options={singleOption} onSelect={() => {}} />
    );
    expect(lastFrame()).toContain("Only Choice");
  });
});
