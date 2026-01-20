import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { OperationMenu } from "../OperationMenu.js";

describe("OperationMenu", () => {
  it("renders the menu label", () => {
    const { lastFrame } = render(
      <OperationMenu onSelect={() => {}} hasProducts={true} />
    );
    expect(lastFrame()).toContain("What would you like to do?");
  });

  it("renders all four options when hasProducts is true", () => {
    const { lastFrame } = render(
      <OperationMenu onSelect={() => {}} hasProducts={true} />
    );
    expect(lastFrame()).toContain("Add new product");
    expect(lastFrame()).toContain("Remove products");
    expect(lastFrame()).toContain("Sync products to Polar");
    expect(lastFrame()).toContain("Regenerate TypeScript exports");
  });

  it("renders only 'Add new product' when hasProducts is false", () => {
    const { lastFrame } = render(
      <OperationMenu onSelect={() => {}} hasProducts={false} />
    );
    expect(lastFrame()).toContain("Add new product");
    expect(lastFrame()).not.toContain("Remove products");
    expect(lastFrame()).not.toContain("Sync products to Polar");
    expect(lastFrame()).not.toContain("Regenerate TypeScript exports");
  });

  it("shows 'No products found' message when hasProducts is false", () => {
    const { lastFrame } = render(
      <OperationMenu onSelect={() => {}} hasProducts={false} />
    );
    expect(lastFrame()).toContain("No products found");
  });

  it("does not show 'No products found' message when hasProducts is true", () => {
    const { lastFrame } = render(
      <OperationMenu onSelect={() => {}} hasProducts={true} />
    );
    expect(lastFrame()).not.toContain("No products found");
  });
});
