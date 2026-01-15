import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { SectionHeader } from "../SectionHeader.js";

describe("SectionHeader", () => {
  it("renders the title", () => {
    const { lastFrame } = render(<SectionHeader title="Test Section" />);
    expect(lastFrame()).toContain("Test Section");
  });

  it("renders different titles", () => {
    const { lastFrame } = render(<SectionHeader title="Authentication Setup" />);
    expect(lastFrame()).toContain("Authentication Setup");
  });
});
