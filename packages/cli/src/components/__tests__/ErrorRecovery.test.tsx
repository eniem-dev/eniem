import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { ErrorRecovery } from "../ErrorRecovery.js";

// Mock useApp from ink
vi.mock("ink", async () => {
  const actual = await vi.importActual("ink");
  return {
    ...actual,
    useApp: () => ({ exit: vi.fn() }),
  };
});

describe("ErrorRecovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the error message", () => {
    const { lastFrame } = render(
      <ErrorRecovery error="Something went wrong" onRetry={() => {}} />
    );
    expect(lastFrame()).toContain("Something went wrong");
    expect(lastFrame()).toContain("✗");
  });

  it("renders context when provided", () => {
    const { lastFrame } = render(
      <ErrorRecovery
        error="Clone failed"
        onRetry={() => {}}
        context="Check your network connection"
      />
    );
    expect(lastFrame()).toContain("Clone failed");
    expect(lastFrame()).toContain("Check your network connection");
  });

  it("does not render context when not provided", () => {
    const { lastFrame } = render(
      <ErrorRecovery error="Error" onRetry={() => {}} />
    );
    expect(lastFrame()).not.toContain("Check your");
  });

  it("renders retry/exit options", () => {
    const { lastFrame } = render(
      <ErrorRecovery error="Error" onRetry={() => {}} />
    );
    expect(lastFrame()).toContain("etry");
    expect(lastFrame()).toContain("xit");
  });

  it("shows retry option as selected by default (capital R)", () => {
    const { lastFrame } = render(
      <ErrorRecovery error="Error" onRetry={() => {}} />
    );
    expect(lastFrame()).toContain("[R]");
  });

  it("shows exit option with lowercase e by default", () => {
    const { lastFrame } = render(
      <ErrorRecovery error="Error" onRetry={() => {}} />
    );
    expect(lastFrame()).toContain("[e]");
  });

  it("renders different error messages", () => {
    const { lastFrame } = render(
      <ErrorRecovery error="Network timeout" onRetry={() => {}} />
    );
    expect(lastFrame()).toContain("Network timeout");
  });
});
