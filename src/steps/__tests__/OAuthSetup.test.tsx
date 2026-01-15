import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { OAuthSetup } from "../OAuthSetup.js";

describe("OAuthSetup", () => {
  it("renders section header", () => {
    const { lastFrame } = render(
      <OAuthSetup onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("OAuth Providers");
  });

  it("starts with GitHub enable prompt", () => {
    const { lastFrame } = render(
      <OAuthSetup onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Enable GitHub OAuth?");
  });

  it("shows yes/no options", () => {
    const { lastFrame } = render(
      <OAuthSetup onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("es");
    expect(lastFrame()).toContain("o");
  });
});
