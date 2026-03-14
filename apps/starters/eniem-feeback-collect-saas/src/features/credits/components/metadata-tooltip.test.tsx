import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MetadataTooltip } from "./metadata-tooltip";

describe("MetadataTooltip", () => {
  it("renders info icon when metadata has entries", () => {
    const { container } = render(
      <MetadataTooltip metadata={{ model: "gpt-4", tokens: 150 }} />
    );

    const icon = container.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon?.classList.contains("lucide-info")).toBe(true);
  });

  it("returns null when metadata is empty", () => {
    const { container } = render(<MetadataTooltip metadata={{}} />);

    expect(container.firstChild).toBeNull();
  });

  it("renders tooltip trigger with data-slot attribute", () => {
    const { container } = render(
      <MetadataTooltip
        metadata={{ model: "gpt-4", tokens: 150, cached: true }}
      />
    );

    const trigger = container.querySelector('[data-slot="tooltip-trigger"]');
    expect(trigger).not.toBeNull();
  });

  it("handles different value types (string, number, boolean)", () => {
    const metadata = {
      stringVal: "test",
      numberVal: 42,
      boolVal: true,
    };

    const { container } = render(<MetadataTooltip metadata={metadata} />);

    // Component renders (doesn't crash with different types)
    expect(container.firstChild).not.toBeNull();
  });
});
