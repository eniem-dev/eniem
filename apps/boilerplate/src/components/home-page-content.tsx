import Link from "next/link";
import { locales } from "@/locales";
import { routes } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PricingCard } from "@/components/pricing-card";
import { KeyRound, CreditCard, Mail, Shield, LayoutDashboard, Moon } from "lucide-react";
import type { GeneratedProduct } from "@/features/subscription";

const featureIcons = [KeyRound, CreditCard, Mail, Shield, LayoutDashboard, Moon];

interface HomePageContentProps {
  products: GeneratedProduct[];
}

export function HomePageContent({ products }: HomePageContentProps) {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 animate-fade-in">
        <div className="absolute inset-0 bg-grid-pattern" />
        <div className="relative container mx-auto px-4 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              {locales.HomePage.hero.title.split(" ").map((word, i) => {
                const isGradient = locales.HomePage.hero.gradientWords.some(
                  (gw) => word.toLowerCase().includes(gw.toLowerCase()),
                );
                return (
                  <span key={i}>
                    {i > 0 && " "}
                    {isGradient ? (
                      <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        {word}
                      </span>
                    ) : (
                      word
                    )}
                  </span>
                );
              })}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              {locales.HomePage.hero.subtitle}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href={routes.auth.signup}>
                <Button size="lg">{locales.HomePage.hero.getStarted}</Button>
              </Link>
              <Button size="lg" variant="outline">
                {locales.HomePage.hero.learnMore}
              </Button>
            </div>
          </div>
          <div className="rounded-xl border bg-muted/50 aspect-video flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Screenshot</span>
          </div>
        </div>
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
      </section>
    </div>
  );
}
