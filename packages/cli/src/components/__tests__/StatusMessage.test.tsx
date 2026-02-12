import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { StatusMessage } from "../StatusMessage.js";

describe("StatusMessage", () => {
  it("renders success status with green checkmark", () => {
    const { lastFrame } = render(<StatusMessage status="success">Done</StatusMessage>);
    expect(lastFrame()).toContain("✓");
    expect(lastFrame()).toContain("Done");
  });

  it("renders error status with red X", () => {
    const { lastFrame } = render(<StatusMessage status="error">Failed</StatusMessage>);
    expect(lastFrame()).toContain("✗");
    expect(lastFrame()).toContain("Failed");
  });

  it("renders skip status with yellow circle", () => {
    const { lastFrame } = render(<StatusMessage status="skip">Skipped</StatusMessage>);
    expect(lastFrame()).toContain("○");
    expect(lastFrame()).toContain("Skipped");
  });

  it("renders info status with cyan arrow", () => {
    const { lastFrame } = render(<StatusMessage status="info">Info message</StatusMessage>);
    expect(lastFrame()).toContain("→");
    expect(lastFrame()).toContain("Info message");
  });
});
