import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: React.ComponentProps<"div">) => (
    <div {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: React.ComponentProps<"div">) => (
    <div {...props}>{children}</div>
  ),
}));

vi.mock("@/components/pricing-card", () => ({
  PricingCard: () => <div data-testid="pricing-card" />,
}));

vi.mock("@/features/subscription", () => ({
  GeneratedProduct: {},
}));

import { HomePageContent } from "./home-page-content";

describe("HomePageContent hero gradient", () => {
  it("applies gradient class only to words matching gradientWords", () => {
    render(<HomePageContent products={[]} />);

    const heading = screen.getByRole("heading", { level: 1 });
    const gradientSpans = heading.querySelectorAll(".bg-clip-text");

    expect(gradientSpans.length).toBeGreaterThan(0);

    gradientSpans.forEach((span) => {
      expect(span.textContent?.toLowerCase()).toContain("headline");
    });
  });

  it("renders non-gradient words without gradient classes", () => {
    render(<HomePageContent products={[]} />);

    const heading = screen.getByRole("heading", { level: 1 });
    // The heading should contain text that is NOT wrapped in a gradient span
    const gradientText = Array.from(heading.querySelectorAll(".bg-clip-text")).map(
      (el) => el.textContent,
    );
    const fullText = heading.textContent ?? "";

    // Full heading text should be longer than just gradient words
    const gradientOnly = gradientText.join("");
    expect(fullText.length).toBeGreaterThan(gradientOnly.length);
  });
});
