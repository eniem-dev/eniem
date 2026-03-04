import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { StorageSetup } from "../StorageSetup.js";

describe("StorageSetup", () => {
  it("renders section header", () => {
    const { lastFrame } = render(
      <StorageSetup onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Storage (DigitalOcean Spaces)");
  });

  it("renders enable confirmation prompt initially", () => {
    const { lastFrame } = render(
      <StorageSetup onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Configure DigitalOcean Spaces for file storage?");
  });

  it("shows yes/no options in enable step", () => {
    const { lastFrame } = render(
      <StorageSetup onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("es");
    expect(lastFrame()).toContain("o");
  });
});
