import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IdeaForm } from "./IdeaForm";

vi.mock("next-safe-action/hooks", () => ({
  useAction: () => ({
    execute: vi.fn(),
    isExecuting: false,
  }),
}));

describe("IdeaForm", () => {
  it("renders title and description fields", () => {
    render(<IdeaForm boardId="board_1" />);

    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<IdeaForm boardId="board_1" />);

    expect(
      screen.getByRole("button", { name: "Submit Idea" })
    ).toBeInTheDocument();
  });

  it("shows placeholder text", () => {
    render(<IdeaForm boardId="board_1" />);

    expect(
      screen.getByPlaceholderText("What's your idea?")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Add more details (optional)")
    ).toBeInTheDocument();
  });
});
