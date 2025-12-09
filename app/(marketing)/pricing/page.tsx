import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { PricingCard } from "@/components/pricing-card";

export async function generateMetadata() {
  const defaultMeta = await getDefaultMetadata();
  return createMetadata({
    ...defaultMeta,
    title: locales.PricingPage.metadata.title,
    description: locales.PricingPage.metadata.description,
  });
}

export default function PricingPage() {
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
