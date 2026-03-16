import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PublicBoardView } from "./PublicBoardView";
import type { IdeaWithAuthor } from "@/features/ideas/components/IdeaCard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/b/test-board",
}));

vi.mock("@/features/ideas/components/IdeaForm", () => ({
  IdeaForm: () => <div data-testid="idea-form">IdeaForm</div>,
}));

vi.mock("@/features/ideas/components/IdeaCard", () => ({
  IdeaCard: ({ idea }: { idea: IdeaWithAuthor }) => (
    <div data-testid={`idea-${idea.id}`}>{idea.title}</div>
  ),
}));

const makeBoard = () => ({
  id: "board_1",
  name: "Test Board",
  slug: "test-board",
  description: "Board description",
  ownerId: "owner_1",
});

const makeIdea = (overrides: Partial<IdeaWithAuthor> = {}): IdeaWithAuthor => ({
  id: "idea_1",
  title: "Test Idea",
  description: "Idea desc",
  status: "OPEN",
  adminResponse: null,
  createdAt: new Date("2026-01-01"),
  author: { id: "u1", name: "Alice", image: null },
  voteCount: 3,
  hasVoted: false,
  ...overrides,
});

describe("PublicBoardView", () => {
  it("renders board name and description", () => {
    render(
      <PublicBoardView
        board={makeBoard()}
        ideas={[]}
        isAuthenticated={false}
        currentUserId={null}
        loginUrl="/login"
        activeStatus={null}
      />
    );

    expect(screen.getByText("Test Board")).toBeInTheDocument();
    expect(screen.getByText("Board description")).toBeInTheDocument();
  });

  it("renders ideas when provided", () => {
    render(
      <PublicBoardView
        board={makeBoard()}
        ideas={[makeIdea(), makeIdea({ id: "idea_2", title: "Second" })]}
        isAuthenticated={false}
        currentUserId={null}
        loginUrl="/login"
        activeStatus={null}
      />
    );

    expect(screen.getByTestId("idea-idea_1")).toBeInTheDocument();
    expect(screen.getByTestId("idea-idea_2")).toBeInTheDocument();
  });

  it("shows empty state when no ideas", () => {
    render(
      <PublicBoardView
        board={makeBoard()}
        ideas={[]}
        isAuthenticated={false}
        currentUserId={null}
        loginUrl="/login"
        activeStatus={null}
      />
    );

    expect(
      screen.getByText("No ideas yet. Be the first to share your feedback!")
    ).toBeInTheDocument();
  });

  it("shows sign-in button for unauthenticated users", () => {
    render(
      <PublicBoardView
        board={makeBoard()}
        ideas={[]}
        isAuthenticated={false}
        currentUserId={null}
        loginUrl="/login"
        activeStatus={null}
      />
    );

    expect(screen.getByText("Sign in to submit an idea")).toBeInTheDocument();
  });

  it("shows submit idea button for authenticated users", () => {
    render(
      <PublicBoardView
        board={makeBoard()}
        ideas={[]}
        isAuthenticated={true}
        currentUserId="user_1"
        loginUrl="/login"
        activeStatus={null}
      />
    );

    expect(screen.getByText("Submit Idea")).toBeInTheDocument();
  });

  it("renders status filter tabs", () => {
    render(
      <PublicBoardView
        board={makeBoard()}
        ideas={[]}
        isAuthenticated={false}
        currentUserId={null}
        loginUrl="/login"
        activeStatus={null}
      />
    );

    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Open" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Planned" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Done" })).toBeInTheDocument();
  });

  it("shows filter-specific empty state when status filter active", () => {
    render(
      <PublicBoardView
        board={makeBoard()}
        ideas={[]}
        isAuthenticated={false}
        currentUserId={null}
        loginUrl="/login"
        activeStatus="PLANNED"
      />
    );

    expect(screen.getByText("No planned ideas yet.")).toBeInTheDocument();
  });

  it("marks active tab as selected", () => {
    render(
      <PublicBoardView
        board={makeBoard()}
        ideas={[]}
        isAuthenticated={false}
        currentUserId={null}
        loginUrl="/login"
        activeStatus="PLANNED"
      />
    );

    expect(screen.getByRole("tab", { name: "Planned" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tab", { name: "All" })).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });
});
