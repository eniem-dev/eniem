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
import type { GeneratedProduct } from "@/features/subscription";

interface ChoosePlanContentProps {
  products: GeneratedProduct[];
}

export function ChoosePlanContent({ products }: ChoosePlanContentProps) {
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
        {products.map((product) => (
          <PricingCard
            key={product.slug}
            name={product.display.title}
            price="$XX"
            period={product.type === "subscription" ? "/month" : ""}
            billing={product.display.subtitle ?? ""}
            features={product.display.features}
            slug={product.slug}
            badge={product.display.badge ?? undefined}
            highlighted={product.display.highlighted}
            ctaLabel={product.display.cta}
          />
        ))}
      </div>
    </div>
  );
}
