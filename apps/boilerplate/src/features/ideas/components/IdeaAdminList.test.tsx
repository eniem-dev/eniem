import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { IdeaAdminList, type AdminIdea } from "./IdeaAdminList";

vi.mock("next-safe-action/hooks", () => ({
  useAction: () => ({
    execute: vi.fn(),
    isExecuting: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const makeIdea = (overrides: Partial<AdminIdea> = {}): AdminIdea => ({
  id: "idea-1",
  title: "Test Idea",
  description: "A description",
  status: "OPEN",
  adminResponse: null,
  createdAt: new Date("2026-01-15"),
  author: { id: "user-1", name: "Alice" },
  voteCount: 5,
  ...overrides,
});

describe("IdeaAdminList", () => {
  it("renders empty state when no ideas", () => {
    render(<IdeaAdminList ideas={[]} />);
    expect(screen.getByText("No ideas submitted yet.")).toBeInTheDocument();
  });

  it("renders idea titles", () => {
    const ideas = [
      makeIdea({ id: "1", title: "First Idea" }),
      makeIdea({ id: "2", title: "Second Idea" }),
    ];
    render(<IdeaAdminList ideas={ideas} />);
    expect(screen.getByText("First Idea")).toBeInTheDocument();
    expect(screen.getByText("Second Idea")).toBeInTheDocument();
  });

  it("renders author name and vote count", () => {
    render(<IdeaAdminList ideas={[makeIdea({ voteCount: 12, author: { id: "u1", name: "Bob" } })]} />);
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
  });

  it("renders respond button for each idea", () => {
    render(<IdeaAdminList ideas={[makeIdea()]} />);
    expect(screen.getByText("Respond")).toBeInTheDocument();
  });

  it("renders delete button for each idea", () => {
    render(<IdeaAdminList ideas={[makeIdea()]} />);
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("renders admin response when present", () => {
    render(
      <IdeaAdminList ideas={[makeIdea({ adminResponse: "Thanks for the feedback!" })]} />
    );
    expect(screen.getByText("Thanks for the feedback!")).toBeInTheDocument();
  });

  it("renders status select for each idea", () => {
    render(<IdeaAdminList ideas={[makeIdea({ status: "PLANNED" })]} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});
