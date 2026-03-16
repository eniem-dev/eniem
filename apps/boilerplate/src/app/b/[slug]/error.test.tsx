import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import BoardError from "./error";

describe("BoardError", () => {
  it("renders network error message", () => {
    render(<BoardError error={new Error("fail")} reset={vi.fn()} />);

    expect(
      screen.getByText("Failed to load ideas. Try again.")
    ).toBeInTheDocument();
  });

  it("renders try again button", () => {
    render(<BoardError error={new Error("fail")} reset={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  it("calls reset when try again is clicked", async () => {
    const reset = vi.fn();
    render(<BoardError error={new Error("fail")} reset={reset} />);

    await userEvent.click(
      screen.getByRole("button", { name: /try again/i })
    );

    expect(reset).toHaveBeenCalledOnce();
  });
});
