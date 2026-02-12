import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { AnalyticsSetup } from "../AnalyticsSetup.js";

describe("AnalyticsSetup", () => {
  it("renders section header", () => {
    const { lastFrame } = render(
      <AnalyticsSetup onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Analytics");
  });

  it("renders enable confirmation prompt initially", () => {
    const { lastFrame } = render(
      <AnalyticsSetup onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Enable analytics?");
  });

  it("shows yes/no options in enable step", () => {
    const { lastFrame } = render(
      <AnalyticsSetup onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("es");
    expect(lastFrame()).toContain("o");
  });
});
