"use client";

import { locales } from "@/locales";
import { PricingCard } from "@/components/pricing-card";
import type { GeneratedProduct } from "@/features/subscription";

interface SubscriptionGateProps {
  products: GeneratedProduct[];
}

export function SubscriptionGate({ products }: SubscriptionGateProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">
          {locales.BoardBilling.pricingInline.heading}
        </h1>
        <p className="text-muted-foreground">
          {locales.BoardBilling.subscriptionRequired}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
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
