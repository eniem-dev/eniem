import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { locales } from "@/locales";
import { SubscriptionGate } from "./SubscriptionGate";
import type { GeneratedProduct } from "@/features/subscription";

vi.mock("@/lib/auth-client", () => ({
  authClient: { checkout: vi.fn() },
  useSession: vi.fn().mockReturnValue({ data: null }),
}));

const mockProducts: GeneratedProduct[] = [
  {
    slug: "monthly",
    display: {
      title: "Monthly",
      price: "$9",
      period: "/mo",
      subtitle: "Billed monthly",
      features: ["Unlimited boards"],
      cta: "Subscribe",
      highlighted: false,
    },
  },
] as unknown as GeneratedProduct[];

describe("SubscriptionGate", () => {
  it("renders heading and subscription message", () => {
    render(<SubscriptionGate products={mockProducts} />);

    expect(
      screen.getByText(locales.BoardBilling.pricingInline.heading)
    ).toBeInTheDocument();
    expect(
      screen.getByText(locales.BoardBilling.subscriptionRequired)
    ).toBeInTheDocument();
  });

  it("renders pricing cards for each product", () => {
    render(<SubscriptionGate products={mockProducts} />);

    expect(screen.getByText("Monthly")).toBeInTheDocument();
    expect(screen.getByText("$9")).toBeInTheDocument();
  });
});
