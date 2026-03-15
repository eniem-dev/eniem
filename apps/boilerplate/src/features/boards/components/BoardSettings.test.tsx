import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BoardSettings } from "./BoardSettings";
import type { Board } from "@/generated/prisma";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next-safe-action/hooks", () => ({
  useAction: () => ({ execute: vi.fn(), isExecuting: false }),
}));

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

describe("BoardSettings", () => {
  it("renders settings form with board data", () => {
    render(<BoardSettings board={makeBoard()} />);

    expect(screen.getByLabelText("Board name")).toHaveValue("Test Board");
    expect(screen.getByLabelText("Description")).toHaveValue("A test board");
    expect(screen.getByText("Save Changes")).toBeInTheDocument();
  });

  it("shows delete button for active boards", () => {
    render(<BoardSettings board={makeBoard()} />);

    expect(screen.getByText("Delete Board")).toBeInTheDocument();
    expect(screen.queryByText("Restore Board")).not.toBeInTheDocument();
  });

  it("shows restore button for deleted boards", () => {
    render(
      <BoardSettings board={makeBoard({ deletedAt: new Date("2026-01-15") })} />
    );

    expect(screen.getByText("Restore Board")).toBeInTheDocument();
    expect(screen.queryByText("Delete Board")).not.toBeInTheDocument();
  });

  it("renders danger zone section", () => {
    render(<BoardSettings board={makeBoard()} />);

    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
  });
});
