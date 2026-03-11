import { describe, it, expect, vi } from "vitest";
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

  it("renders all items plus Select all", () => {
    const { lastFrame } = render(
      <MultiSelect label="Select items" items={items} onSubmit={() => {}} />
    );
    expect(lastFrame()).toContain("Select all");
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

  it("highlights first item (Select all) by default", () => {
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
    expect(lastFrame()).toContain("Select all");
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

  it("renders with all items initially selected and Select all checked", () => {
    const { lastFrame } = render(
      <MultiSelect
        label="Select items"
        items={items}
        onSubmit={() => {}}
        initialSelected={["a", "b", "c"]}
      />
    );
    expect(lastFrame()).toContain("Selected: 3 items");
    // Select all should show as checked when all items are selected
    const frame = lastFrame() ?? "";
    const lines = frame.split("\n");
    const selectAllLine = lines.find((l) => l.includes("Select all"));
    expect(selectAllLine).toContain("◉");
  });

  it("toggles Select all to check all items", async () => {
    const { lastFrame, stdin } = render(
      <MultiSelect label="Select items" items={items} onSubmit={() => {}} />
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    // Highlight is on Select all (index 0), press space
    stdin.write(" ");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(lastFrame()).toContain("Selected: 3 items");
  });

  it("toggles Select all to uncheck all when all selected", async () => {
    const { lastFrame, stdin } = render(
      <MultiSelect
        label="Select items"
        items={items}
        onSubmit={() => {}}
        initialSelected={["a", "b", "c"]}
      />
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    // Highlight is on Select all (index 0), press space to uncheck all
    stdin.write(" ");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(lastFrame()).toContain("Selected: 0 items");
  });

  it("unchecking one item after Select all unchecks Select all indicator", async () => {
    const { lastFrame, stdin } = render(
      <MultiSelect
        label="Select items"
        items={items}
        onSubmit={() => {}}
        initialSelected={["a", "b", "c"]}
      />
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    // Move down to Item A (index 1) and uncheck it
    stdin.write("j");
    stdin.write(" ");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(lastFrame()).toContain("Selected: 2 items");
    // Select all should no longer be checked
    const frame = lastFrame() ?? "";
    const lines = frame.split("\n");
    const selectAllLine = lines.find((l) => l.includes("Select all"));
    expect(selectAllLine).toContain("○");
  });

  it("re-checking last unchecked item re-checks Select all", async () => {
    const { lastFrame, stdin } = render(
      <MultiSelect
        label="Select items"
        items={items}
        onSubmit={() => {}}
        initialSelected={["a", "b"]}
      />
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    // Move down to Item C (index 3) and check it
    stdin.write("j");
    stdin.write("j");
    stdin.write("j");
    stdin.write(" ");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(lastFrame()).toContain("Selected: 3 items");
    const frame = lastFrame() ?? "";
    const lines = frame.split("\n");
    const selectAllLine = lines.find((l) => l.includes("Select all"));
    expect(selectAllLine).toContain("◉");
  });

  it("does not call onSubmit when required and no items selected", async () => {
    const onSubmit = vi.fn();
    const { lastFrame, stdin } = render(
      <MultiSelect label="Select items" items={items} onSubmit={onSubmit} required emptyHintText="Select at least one spec" />
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\r");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(lastFrame()).toContain("Select at least one spec");
  });

  it("allows empty submission when not required", async () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <MultiSelect label="Select items" items={items} onSubmit={onSubmit} />
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\r");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onSubmit).toHaveBeenCalledWith([]);
  });

  it("calls onSubmit with selected values excluding __select_all__", async () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <MultiSelect
        label="Select items"
        items={items}
        onSubmit={onSubmit}
        initialSelected={["a", "b"]}
      />
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\r");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onSubmit).toHaveBeenCalledWith(["a", "b"]);
  });

  it("preserves toggle order in onSubmit output", async () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <MultiSelect label="Select items" items={items} onSubmit={onSubmit} />
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    // Select Item C (index 3), then Item A (index 1)
    stdin.write("j"); // index 1 - Item A
    stdin.write("j"); // index 2 - Item B
    stdin.write("j"); // index 3 - Item C
    stdin.write(" "); // toggle Item C
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("k"); // index 2 - Item B
    stdin.write("k"); // index 1 - Item A
    stdin.write(" "); // toggle Item A
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\r");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onSubmit).toHaveBeenCalledWith(["c", "a"]);
  });
});
