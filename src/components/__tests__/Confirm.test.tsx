import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { Confirm } from "../Confirm.js";

describe("Confirm", () => {
  it("renders the label", () => {
    const { lastFrame } = render(
      <Confirm label="Continue?" onConfirm={() => {}} />
    );
    expect(lastFrame()).toContain("Continue?");
  });

  it("renders yes/no options", () => {
    const { lastFrame } = render(
      <Confirm label="Continue?" onConfirm={() => {}} />
    );
    expect(lastFrame()).toContain("es");
    expect(lastFrame()).toContain("o");
  });

  it("defaults to false (no)", () => {
    const { lastFrame } = render(
      <Confirm label="Continue?" onConfirm={() => {}} />
    );
    // When default is false, capital N should be shown
    expect(lastFrame()).toContain("[N]");
  });

  it("respects defaultValue=true", () => {
    const { lastFrame } = render(
      <Confirm label="Continue?" onConfirm={() => {}} defaultValue={true} />
    );
    // When default is true, capital Y should be shown
    expect(lastFrame()).toContain("[Y]");
  });

  it("shows lowercase y when default is false", () => {
    const { lastFrame } = render(
      <Confirm label="Save?" onConfirm={() => {}} defaultValue={false} />
    );
    expect(lastFrame()).toContain("[y]");
  });

  it("shows lowercase n when default is true", () => {
    const { lastFrame } = render(
      <Confirm label="Save?" onConfirm={() => {}} defaultValue={true} />
    );
    expect(lastFrame()).toContain("[n]");
  });

  it("renders different labels", () => {
    const { lastFrame } = render(
      <Confirm label="Delete all files?" onConfirm={() => {}} />
    );
    expect(lastFrame()).toContain("Delete all files?");
  });

  it("renders separator between options", () => {
    const { lastFrame } = render(
      <Confirm label="Continue?" onConfirm={() => {}} />
    );
    expect(lastFrame()).toContain("/");
  });
});
