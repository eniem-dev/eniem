import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BoardCard } from "./BoardCard";
import type { Board } from "@/generated/prisma";

const makeBoard = (overrides: Partial<Board> = {}): Board => ({
  id: "board_1",
  name: "Test Board",
  slug: "test-board",
  description: "A test board",
  deletedAt: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  ownerId: "user_1",
  ...overrides,
});

describe("BoardCard", () => {
  it("renders board name and description", () => {
    render(<BoardCard board={makeBoard()} />);

    expect(screen.getByText("Test Board")).toBeInTheDocument();
    expect(screen.getByText("A test board")).toBeInTheDocument();
  });

  it("shows deleted badge for soft-deleted boards", () => {
    render(
      <BoardCard board={makeBoard({ deletedAt: new Date("2026-01-15") })} />
    );

    expect(screen.getByText("Deleted")).toBeInTheDocument();
  });

  it("hides view link for deleted boards", () => {
    render(
      <BoardCard board={makeBoard({ deletedAt: new Date("2026-01-15") })} />
    );

    expect(screen.queryByText("View board")).not.toBeInTheDocument();
  });

  it("shows view link for active boards", () => {
    render(<BoardCard board={makeBoard()} />);

    expect(screen.getByText("View board")).toBeInTheDocument();
  });

  it("shows idea and vote counts", () => {
    render(<BoardCard board={makeBoard()} />);

    expect(screen.getByText("0 ideas")).toBeInTheDocument();
    expect(screen.getByText("0 votes")).toBeInTheDocument();
  });
});
