import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrowserFrame } from "./browser-frame";

describe("BrowserFrame", () => {
  it("renders children in the content area", () => {
    render(
      <BrowserFrame>
        <img alt="Screenshot" src="/test.png" />
      </BrowserFrame>
    );
    expect(screen.getByAltText("Screenshot")).toBeInTheDocument();
  });

  it("renders title bar with three dots", () => {
    const { container } = render(<BrowserFrame>Content</BrowserFrame>);
    const titlebar = container.querySelector('[data-slot="browser-frame-titlebar"]');
    expect(titlebar).toBeInTheDocument();
    const dots = titlebar!.querySelectorAll("span");
    expect(dots).toHaveLength(3);
  });

  it("applies custom className", () => {
    const { container } = render(
      <BrowserFrame className="max-w-2xl">Content</BrowserFrame>
    );
    const frame = container.querySelector('[data-slot="browser-frame"]');
    expect(frame).toHaveClass("max-w-2xl");
  });

  it("has data-slot attribute", () => {
    const { container } = render(<BrowserFrame>Content</BrowserFrame>);
    const frame = container.querySelector('[data-slot="browser-frame"]');
    expect(frame).toHaveAttribute("data-slot", "browser-frame");
  });
});
