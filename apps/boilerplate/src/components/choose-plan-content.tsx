"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { env } from "@/config";
import { locales } from "@/locales";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { ErrorCard } from "@/components/error-card";
import { PricingCard } from "@/components/pricing-card";
import {
  getPlanSelectionFromSearchParams,
  hasPlanSelection,
} from "@/lib/plan-selection";
import type { GeneratedProduct } from "@/features/billing";

interface ChoosePlanContentProps {
  products: GeneratedProduct[];
}

export function ChoosePlanContent({ products }: ChoosePlanContentProps) {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const hasTriggeredCheckout = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const planSelection = useMemo(
    () => getPlanSelectionFromSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const hasSelection = hasPlanSelection(planSelection);

  const triggerCheckout = useCallback(async () => {
    try {
      hasTriggeredCheckout.current = true;
      setError(null);
      await authClient.checkout({
        slug: planSelection.slug,
        products: planSelection.products,
      });
    } catch (err) {
      logger.error("Checkout failed", { error: err, planSelection });
      setError(locales.ChoosePlanPage.checkoutError);
      hasTriggeredCheckout.current = false;
    }
  }, [planSelection]);

  useEffect(() => {
    if (!session?.user || hasTriggeredCheckout.current || !hasSelection) return;
    triggerCheckout();
  }, [session, hasSelection, triggerCheckout]);

  if (hasSelection) {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <ErrorCard
            message={error}
            actions={
              <>
                <Button onClick={triggerCheckout}>
                  {locales.ChoosePlanPage.tryAgain}
                </Button>
                <Button variant="outline" asChild>
                  <a href={`mailto:${env.support.email}`}>
                    {locales.ChoosePlanPage.contactSupport}
                  </a>
                </Button>
              </>
            }
          />
        </div>
      );
    }

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

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-12">
        {products.map((product) => (
          <PricingCard
            key={product.slug}
            name={product.display.title}
            price={product.display.price}
            period={product.display.period ?? ""}
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
