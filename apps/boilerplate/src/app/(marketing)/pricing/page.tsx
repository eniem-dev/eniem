import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { PricingCard } from "@/components/pricing-card";
import { getDisplayProducts } from "@/features/billing";
import { env } from "@/config";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.PricingPage.metadata.title,
  description: locales.PricingPage.metadata.description,
});

export default function PricingPage() {
  const products = getDisplayProducts(env.payment.polarServer);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          {locales.PricingPage.title}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {locales.PricingPage.subtitle}
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
