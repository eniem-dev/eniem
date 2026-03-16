import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NotFound from "./not-found";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    asChild?: boolean;
    variant?: string;
  }) => <button {...props}>{children}</button>,
}));

describe("BoardNotFound", () => {
  it("renders 404 code", () => {
    render(<NotFound />);

    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("renders board not found message", () => {
    render(<NotFound />);

    expect(
      screen.getByText("This board doesn't exist.")
    ).toBeInTheDocument();
  });

  it("renders back to home link", () => {
    render(<NotFound />);

    expect(screen.getByRole("link")).toBeInTheDocument();
  });
});
