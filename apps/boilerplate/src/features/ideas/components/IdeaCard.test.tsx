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
  voteCount: 0,
  hasVoted: false,
  ...overrides,
});

describe("IdeaCard", () => {
  it("renders idea title and author", () => {
    render(
      <IdeaCard
        idea={makeIdea()}
        currentUserId={null}
        isBoardOwner={false}
        loginUrl="/auth/login"
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
        loginUrl="/auth/login"
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
        loginUrl="/auth/login"
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
        loginUrl="/auth/login"
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
        loginUrl="/auth/login"
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

  it("has role=button and aria-expanded on header", () => {
    render(
      <IdeaCard
        idea={makeIdea()}
        currentUserId={null}
        isBoardOwner={false}
        loginUrl="/auth/login"
      />
    );

    const header = screen.getByRole("button", { name: /My Great Idea/ });
    expect(header).toHaveAttribute("aria-expanded", "false");
  });

  it("sets aria-expanded=true when expanded", async () => {
    const user = userEvent.setup();

    render(
      <IdeaCard
        idea={makeIdea()}
        currentUserId={null}
        isBoardOwner={false}
        loginUrl="/auth/login"
      />
    );

    const header = screen.getByRole("button", { name: /My Great Idea/ });
    await user.click(header);
    expect(header).toHaveAttribute("aria-expanded", "true");
  });

  it("expands on Enter key press", async () => {
    const user = userEvent.setup();

    render(
      <IdeaCard
        idea={makeIdea()}
        currentUserId="user_1"
        isBoardOwner={false}
        loginUrl="/auth/login"
      />
    );

    const header = screen.getByRole("button", { name: /My Great Idea/ });
    header.focus();
    await user.keyboard("{Enter}");
    expect(header).toHaveAttribute("aria-expanded", "true");
  });

  it("shows admin response with badge when expanded", async () => {
    const user = userEvent.setup();

    render(
      <IdeaCard
        idea={makeIdea({ adminResponse: "Thanks for the feedback!" })}
        currentUserId={null}
        isBoardOwner={false}
        loginUrl="/auth/login"
      />
    );

    await user.click(screen.getByRole("button", { name: /My Great Idea/ }));

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Thanks for the feedback!")).toBeInTheDocument();
  });

  it("does not show admin response section when null", async () => {
    const user = userEvent.setup();

    render(
      <IdeaCard
        idea={makeIdea({ adminResponse: null })}
        currentUserId={null}
        isBoardOwner={false}
        loginUrl="/auth/login"
      />
    );

    await user.click(screen.getByRole("button", { name: /My Great Idea/ }));

    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("shows delete for board owner who is not author", async () => {
    const user = userEvent.setup();

    render(
      <IdeaCard
        idea={makeIdea()}
        currentUserId="user_2"
        isBoardOwner={true}
        loginUrl="/auth/login"
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
