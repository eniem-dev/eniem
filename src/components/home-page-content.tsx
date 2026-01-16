import Link from "next/link";
import { locales } from "@/locales";
import { routes } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PricingCard } from "@/components/pricing-card";
import { KeyRound, CreditCard, Mail, Shield, LayoutDashboard, Moon } from "lucide-react";

const featureIcons = [KeyRound, CreditCard, Mail, Shield, LayoutDashboard, Moon];

export function HomePageContent() {
  return (
    <div>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center animate-fade-in">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
          {locales.HomePage.hero.title}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto sm:text-xl">
          {locales.HomePage.hero.subtitle}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={routes.auth.signup}>
            <Button size="lg">{locales.HomePage.hero.getStarted}</Button>
          </Link>
          <Button size="lg" variant="outline">
            {locales.HomePage.hero.watchDemo}
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {locales.HomePage.features.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {locales.HomePage.features.subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {locales.HomePage.features.items.map((feature, index) => {
            const Icon = featureIcons[index];
            return (
              <Card
                key={index}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {locales.HomePage.pricing.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {locales.HomePage.pricing.subtitle}
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
      </section>
    </div>
  );
}
