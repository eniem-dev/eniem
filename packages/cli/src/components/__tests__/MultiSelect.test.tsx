import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { MultiSelect } from "../MultiSelect.js";

describe("MultiSelect", () => {
  const items = [
    { label: "Item A", value: "a" },
    { label: "Item B", value: "b" },
    { label: "Item C", value: "c" },
  ];

  it("renders the label", () => {
    const { lastFrame } = render(
      <MultiSelect label="Select items" items={items} onSubmit={() => {}} />
    );
    expect(lastFrame()).toContain("Select items");
  });

  it("renders all items", () => {
    const { lastFrame } = render(
      <MultiSelect label="Select items" items={items} onSubmit={() => {}} />
    );
    expect(lastFrame()).toContain("Item A");
    expect(lastFrame()).toContain("Item B");
    expect(lastFrame()).toContain("Item C");
  });

  it("renders usage instructions", () => {
    const { lastFrame } = render(
      <MultiSelect label="Select items" items={items} onSubmit={() => {}} />
    );
    expect(lastFrame()).toContain("navigate");
    expect(lastFrame()).toContain("toggle");
    expect(lastFrame()).toContain("confirm");
  });

  it("shows selection count", () => {
    const { lastFrame } = render(
      <MultiSelect label="Select items" items={items} onSubmit={() => {}} />
    );
    expect(lastFrame()).toContain("Selected: 0 items");
  });

  it("shows initial selections", () => {
    const { lastFrame } = render(
      <MultiSelect
        label="Select items"
        items={items}
        onSubmit={() => {}}
        initialSelected={["a", "b"]}
      />
    );
    expect(lastFrame()).toContain("Selected: 2 items");
  });

  it("highlights first item by default", () => {
    const { lastFrame } = render(
      <MultiSelect label="Select items" items={items} onSubmit={() => {}} />
    );
    expect(lastFrame()).toContain("❯");
  });

  it("shows unselected indicator for items", () => {
    const { lastFrame } = render(
      <MultiSelect label="Select items" items={items} onSubmit={() => {}} />
    );
    expect(lastFrame()).toContain("○");
  });

  it("shows selected indicator for initially selected items", () => {
    const { lastFrame } = render(
      <MultiSelect
        label="Select items"
        items={items}
        onSubmit={() => {}}
        initialSelected={["a"]}
      />
    );
    expect(lastFrame()).toContain("◉");
  });

  it("handles empty items list", () => {
    const { lastFrame } = render(
      <MultiSelect label="Select items" items={[]} onSubmit={() => {}} />
    );
    expect(lastFrame()).toContain("Select items");
    expect(lastFrame()).toContain("Selected: 0 items");
  });

  it("handles single item", () => {
    const singleItem = [{ label: "Only Item", value: "only" }];
    const { lastFrame } = render(
      <MultiSelect label="Select items" items={singleItem} onSubmit={() => {}} />
    );
    expect(lastFrame()).toContain("Only Item");
  });

  it("shows singular 'item' when exactly 1 selected", () => {
    const { lastFrame } = render(
      <MultiSelect
        label="Select items"
        items={items}
        onSubmit={() => {}}
        initialSelected={["a"]}
      />
    );
    expect(lastFrame()).toContain("Selected: 1 item");
    expect(lastFrame()).not.toContain("Selected: 1 items");
  });

  it("renders with all items initially selected", () => {
    const { lastFrame } = render(
      <MultiSelect
        label="Select items"
        items={items}
        onSubmit={() => {}}
        initialSelected={["a", "b", "c"]}
      />
    );
    expect(lastFrame()).toContain("Selected: 3 items");
  });
});
