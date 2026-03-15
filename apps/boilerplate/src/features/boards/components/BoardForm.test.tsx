import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BoardForm } from "./BoardForm";

vi.mock("next-safe-action/hooks", () => ({
  useAction: () => ({
    execute: vi.fn(),
    isExecuting: false,
  }),
}));

describe("BoardForm", () => {
  it("renders all form fields", () => {
    render(<BoardForm />);

    expect(screen.getByLabelText("Board name")).toBeInTheDocument();
    expect(screen.getByLabelText("URL slug")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Board" })
    ).toBeInTheDocument();
  });

  it("auto-generates slug from name", async () => {
    const user = userEvent.setup();
    render(<BoardForm />);

    const nameInput = screen.getByLabelText("Board name");
    await user.type(nameInput, "My Cool Product");

    const slugInput = screen.getByLabelText("URL slug") as HTMLInputElement;
    expect(slugInput.value).toBe("my-cool-product");
  });

  it("shows slug URL preview", async () => {
    const user = userEvent.setup();
    render(<BoardForm />);

    const nameInput = screen.getByLabelText("Board name");
    await user.type(nameInput, "Test");

    expect(screen.getByText(/yourdomain\.com\/b\/test/)).toBeInTheDocument();
  });

  it("shows validation error for invalid slug", async () => {
    const user = userEvent.setup();
    render(<BoardForm />);

    const slugInput = screen.getByLabelText("URL slug");
    await user.type(slugInput, "ab");
    await user.tab();

    const nameInput = screen.getByLabelText("Board name");
    await user.type(nameInput, "X");
    await user.tab();

    // Slug too short validation should appear
    expect(await screen.findByText(/at least 3/i)).toBeInTheDocument();
  });
});
