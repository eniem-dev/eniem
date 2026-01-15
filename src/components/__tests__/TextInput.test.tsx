import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { TextInput } from "../TextInput.js";

describe("TextInput", () => {
  it("renders the label", () => {
    const { lastFrame } = render(
      <TextInput label="Name" value="" onChange={() => {}} />
    );
    expect(lastFrame()).toContain("Name:");
  });

  it("renders the current value", () => {
    const { lastFrame } = render(
      <TextInput label="Name" value="test-value" onChange={() => {}} />
    );
    expect(lastFrame()).toContain("test-value");
  });

  it("renders placeholder when value is empty", () => {
    const { lastFrame } = render(
      <TextInput
        label="Name"
        value=""
        onChange={() => {}}
        placeholder="Enter name"
      />
    );
    expect(lastFrame()).toContain("Enter name");
  });

  it("renders error message when error prop is provided", () => {
    const { lastFrame } = render(
      <TextInput
        label="Name"
        value=""
        onChange={() => {}}
        error="Name is required"
      />
    );
    expect(lastFrame()).toContain("✗");
    expect(lastFrame()).toContain("Name is required");
  });

  it("does not render error when error prop is not provided", () => {
    const { lastFrame } = render(
      <TextInput label="Name" value="" onChange={() => {}} />
    );
    expect(lastFrame()).not.toContain("✗");
  });

  it("renders with mask prop", () => {
    const { lastFrame } = render(
      <TextInput label="Password" value="secret" onChange={() => {}} mask="*" />
    );
    expect(lastFrame()).toContain("Password:");
    // Masked text doesn't show actual value
    expect(lastFrame()).not.toContain("secret");
  });

  it("renders label with different text", () => {
    const { lastFrame } = render(
      <TextInput label="Email" value="test@example.com" onChange={() => {}} />
    );
    expect(lastFrame()).toContain("Email:");
    expect(lastFrame()).toContain("test@example.com");
  });
});
