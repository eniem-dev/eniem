import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VoteButton } from "./VoteButton";

const mockExecute = vi.fn();

vi.mock("next-safe-action/hooks", () => ({
  useAction: () => ({
    execute: mockExecute,
    isExecuting: false,
  }),
}));

describe("VoteButton", () => {
  it("renders vote count", () => {
    render(
      <VoteButton
        ideaId="idea_1"
        voteCount={5}
        hasVoted={false}
        isAuthenticated={true}
        loginUrl="/auth/login"
      />
    );

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("sets aria-pressed=false when not voted", () => {
    render(
      <VoteButton
        ideaId="idea_1"
        voteCount={3}
        hasVoted={false}
        isAuthenticated={true}
        loginUrl="/auth/login"
      />
    );

    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("sets aria-pressed=true when voted", () => {
    render(
      <VoteButton
        ideaId="idea_1"
        voteCount={3}
        hasVoted={true}
        isAuthenticated={true}
        loginUrl="/auth/login"
      />
    );

    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("has upvote aria-label when not voted", () => {
    render(
      <VoteButton
        ideaId="idea_1"
        voteCount={3}
        hasVoted={false}
        isAuthenticated={true}
        loginUrl="/auth/login"
      />
    );

    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Upvote, 3 votes"
    );
  });

  it("has remove upvote aria-label when voted", () => {
    render(
      <VoteButton
        ideaId="idea_1"
        voteCount={3}
        hasVoted={true}
        isAuthenticated={true}
        loginUrl="/auth/login"
      />
    );

    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Remove upvote, 3 votes"
    );
  });

  it("redirects to login when unauthenticated user clicks", async () => {
    const user = userEvent.setup();
    const originalLocation = window.location.href;

    render(
      <VoteButton
        ideaId="idea_1"
        voteCount={3}
        hasVoted={false}
        isAuthenticated={false}
        loginUrl="/auth/login"
      />
    );

    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: originalLocation },
    });

    await user.click(screen.getByRole("button"));

    expect(window.location.href).toBe("/auth/login");
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("calls execute with ideaId when authenticated user clicks", async () => {
    const user = userEvent.setup();

    render(
      <VoteButton
        ideaId="idea_1"
        voteCount={3}
        hasVoted={false}
        isAuthenticated={true}
        loginUrl="/auth/login"
      />
    );

    await user.click(screen.getByRole("button"));

    expect(mockExecute).toHaveBeenCalledWith({ ideaId: "idea_1" });
  });
});
