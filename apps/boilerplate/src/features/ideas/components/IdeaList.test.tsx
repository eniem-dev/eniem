import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IdeaList } from "./IdeaList";
import type { IdeaWithAuthor } from "./IdeaCard";

vi.mock("next-safe-action/hooks", () => ({
  useAction: () => ({
    execute: vi.fn(),
    isExecuting: false,
  }),
}));

const makeIdea = (id: string, title: string): IdeaWithAuthor => ({
  id,
  title,
  description: null,
  status: "OPEN",
  adminResponse: null,
  createdAt: new Date("2026-03-01"),
  author: { id: "user_1", name: "Alice", image: null },
});

describe("IdeaList", () => {
  it("renders empty state when no ideas", () => {
    render(
      <IdeaList ideas={[]} currentUserId={null} isBoardOwner={false} />
    );

    expect(
      screen.getByText("No ideas yet. Be the first to share your feedback!")
    ).toBeInTheDocument();
  });

  it("renders idea cards", () => {
    const ideas = [
      makeIdea("1", "First Idea"),
      makeIdea("2", "Second Idea"),
    ];

    render(
      <IdeaList ideas={ideas} currentUserId={null} isBoardOwner={false} />
    );

    expect(screen.getByText("First Idea")).toBeInTheDocument();
    expect(screen.getByText("Second Idea")).toBeInTheDocument();
  });
});
