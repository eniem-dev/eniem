import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { locales } from "@/locales";
import { LapsedSubscriptionBanner } from "./LapsedSubscriptionBanner";

vi.mock("@/lib/auth-client", () => ({
  authClient: { customer: { portal: vi.fn() } },
}));

describe("LapsedSubscriptionBanner", () => {
  it("renders renewal text and CTA button", () => {
    render(<LapsedSubscriptionBanner />);

    expect(
      screen.getByText(locales.BoardBilling.renewalBanner.text)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: locales.BoardBilling.renewalBanner.cta,
      })
    ).toBeInTheDocument();
  });
});
