import { describe, it, expect, vi } from "vitest";
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

  it("shows database storage skip message when declining", async () => {
    const onComplete = vi.fn();
    const { lastFrame, stdin } = render(
      <StorageSetup onComplete={onComplete} />
    );
    await new Promise((r) => setTimeout(r, 50));
    stdin.write("n");
    await new Promise((r) => setTimeout(r, 50));
    expect(lastFrame()).toContain("Skipped — using database storage for development");
    expect(onComplete).toHaveBeenCalledWith({ enabled: false, provider: "database" });
  });
});
