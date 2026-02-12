import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { Spinner } from "../Spinner.js";

describe("Spinner", () => {
  it("renders the label", () => {
    const { lastFrame } = render(<Spinner label="Loading..." />);
    expect(lastFrame()).toContain("Loading...");
  });

  it("renders different labels", () => {
    const { lastFrame } = render(<Spinner label="Installing dependencies" />);
    expect(lastFrame()).toContain("Installing dependencies");
  });
});
