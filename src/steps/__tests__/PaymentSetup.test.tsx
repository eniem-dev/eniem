import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { PaymentSetup } from "../PaymentSetup.js";

describe("PaymentSetup", () => {
  it("renders section header", () => {
    const { lastFrame } = render(
      <PaymentSetup onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Payments (Polar)");
  });

  it("renders enable confirmation prompt initially", () => {
    const { lastFrame } = render(
      <PaymentSetup onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("Configure Polar payments?");
  });

  it("shows yes/no options in enable step", () => {
    const { lastFrame } = render(
      <PaymentSetup onComplete={() => {}} />
    );
    expect(lastFrame()).toContain("es");
    expect(lastFrame()).toContain("o");
  });
});
