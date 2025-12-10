"use client";

import { useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { locales } from "@/locales";
import { PricingCard } from "@/components/pricing-card";
import {
  getPlanSelectionFromSearchParams,
  hasPlanSelection,
} from "@/lib/plan-selection";

export function ChoosePlanContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const hasTriggeredCheckout = useRef(false);

  const planSelection = useMemo(
    () => getPlanSelectionFromSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const hasSelection = hasPlanSelection(planSelection);

  useEffect(() => {
    if (!session?.user || hasTriggeredCheckout.current || !hasSelection) return;
    hasTriggeredCheckout.current = true;
    authClient.checkout({
      slug: planSelection.slug,
      products: planSelection.products,
    });
  }, [session, hasSelection, planSelection]);

  if (hasSelection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-lg text-muted-foreground">
          {locales.ChoosePlanPage.redirectingToCheckout}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          {locales.ChoosePlanPage.title}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {locales.ChoosePlanPage.subtitle}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-12">
        <PricingCard
          name={locales.PricingCard.proMonthly.name}
          price={locales.PricingCard.proMonthly.price}
          period={locales.PricingCard.proMonthly.period}
          billing={locales.PricingCard.proMonthly.billing}
          features={locales.PricingCard.proMonthly.features}
          slug="pro-monthly"
          ctaLabel={locales.PricingCard.proMonthly.cta}
        />

        <PricingCard
          name={locales.PricingCard.proYearly.name}
          price={locales.PricingCard.proYearly.price}
          period={locales.PricingCard.proYearly.period}
          billing={locales.PricingCard.proYearly.billing}
          features={locales.PricingCard.proYearly.features}
          slug="pro-yearly"
          badge={locales.PricingCard.proYearly.badge}
          highlighted
          ctaLabel={locales.PricingCard.proYearly.cta}
        />
      </div>
    </div>
  );
}
