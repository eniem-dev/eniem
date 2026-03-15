import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IdeaCard, type IdeaWithAuthor } from "./IdeaCard";

vi.mock("next-safe-action/hooks", () => ({
  useAction: () => ({
    execute: vi.fn(),
    isExecuting: false,
  }),
}));

const makeIdea = (overrides: Partial<IdeaWithAuthor> = {}): IdeaWithAuthor => ({
  id: "idea_1",
  title: "My Great Idea",
  description: "Some details about this idea",
  status: "OPEN",
  adminResponse: null,
  createdAt: new Date("2026-03-01"),
  author: { id: "user_1", name: "Alice", image: null },
  ...overrides,
});

describe("IdeaCard", () => {
  it("renders idea title and author", () => {
    render(
      <IdeaCard
        idea={makeIdea()}
        currentUserId={null}
        isBoardOwner={false}
      />
    );

    expect(screen.getByText("My Great Idea")).toBeInTheDocument();
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  it("shows OPEN status badge", () => {
    render(
      <IdeaCard
        idea={makeIdea()}
        currentUserId={null}
        isBoardOwner={false}
      />
    );

    expect(screen.getByText("OPEN")).toBeInTheDocument();
  });

  it("shows description preview when collapsed", () => {
    render(
      <IdeaCard
        idea={makeIdea()}
        currentUserId={null}
        isBoardOwner={false}
      />
    );

    expect(
      screen.getByText("Some details about this idea")
    ).toBeInTheDocument();
  });

  it("expands on click to show edit/delete for author", async () => {
    const user = userEvent.setup();

    render(
      <IdeaCard
        idea={makeIdea()}
        currentUserId="user_1"
        isBoardOwner={false}
      />
    );

    await user.click(screen.getByText("My Great Idea"));

    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete" })
    ).toBeInTheDocument();
  });

  it("does not show edit/delete for non-author", async () => {
    const user = userEvent.setup();

    render(
      <IdeaCard
        idea={makeIdea()}
        currentUserId="user_2"
        isBoardOwner={false}
      />
    );

    await user.click(screen.getByText("My Great Idea"));

    expect(
      screen.queryByRole("button", { name: "Edit" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" })
    ).not.toBeInTheDocument();
  });

  it("shows delete for board owner who is not author", async () => {
    const user = userEvent.setup();

    render(
      <IdeaCard
        idea={makeIdea()}
        currentUserId="user_2"
        isBoardOwner={true}
      />
    );

    await user.click(screen.getByText("My Great Idea"));

    expect(
      screen.queryByRole("button", { name: "Edit" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete" })
    ).toBeInTheDocument();
  });
});
