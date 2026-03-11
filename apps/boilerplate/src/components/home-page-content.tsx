"use client";

import Link from "next/link";
import { locales } from "@/locales";
import { routes } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PricingCard } from "@/components/pricing-card";
import { TestimonialCard } from "@/components/testimonial-card";
import { LogoCloud } from "@/components/logo-cloud";
import {
  KeyRound,
  CreditCard,
  Mail,
  Shield,
  LayoutDashboard,
  Moon,
  ArrowRight,
  Users,
  ShieldCheck,
} from "lucide-react";
import type { GeneratedProduct } from "@/features/subscription";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const featureIcons = [KeyRound, CreditCard, Mail, Shield, LayoutDashboard, Moon];

const REVEAL_INITIAL = {
  up: { opacity: 0, y: 40 },
  down: { opacity: 0, y: -40 },
  left: { opacity: 0, x: -40 },
  right: { opacity: 0, x: 40 },
  scale: { opacity: 0, scale: 0.92 },
  none: { opacity: 0 },
} as const;

const REVEAL_ANIMATE = { opacity: 1, y: 0, x: 0, scale: 1 };
const REVEAL_EASE = [0.21, 0.47, 0.32, 0.98] as const;

function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: keyof typeof REVEAL_INITIAL;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const initial = REVEAL_INITIAL[direction];

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={isInView ? REVEAL_ANIMATE : initial}
      transition={{ duration: 0.7, delay, ease: REVEAL_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface HomePageContentProps {
  products: GeneratedProduct[];
}

export function HomePageContent({ products }: HomePageContentProps) {
  return (
    <div className="overflow-hidden">
      <section className="relative py-32 md:py-40 lg:py-52">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 38%, oklch(0.92 0.005 260 / 0.5) 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 dark:hidden"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 50% 42%, oklch(0.90 0.01 260 / 0.35) 0%, transparent 65%)",
          }}
        />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Reveal direction="none" delay={0.1}>
              <Badge
                variant="outline"
                className="px-4 py-1.5 text-[10px] font-semibold tracking-[0.15em] uppercase"
              >
                {locales.HomePage.hero.badge}
              </Badge>
            </Reveal>

            <Reveal direction="scale" delay={0.2}>
              <h1 className="mt-8 text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9]">
                {locales.HomePage.hero.title}
              </h1>
            </Reveal>

            <Reveal direction="none" delay={0.35}>
              <div className="mx-auto mt-8 h-px w-16 bg-foreground/20" />
            </Reveal>

            <Reveal direction="none" delay={0.4}>
              <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                {locales.HomePage.hero.subtitle}
              </p>
            </Reveal>

            <Reveal direction="up" delay={0.55}>
              <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={routes.auth.signup}>
                  <Button size="lg" className="gap-2 px-7">
                    {locales.HomePage.hero.getStarted}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline">
                  {locales.HomePage.hero.watchDemo}
                </Button>
              </div>
            </Reveal>

            <Reveal direction="none" delay={0.7}>
              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/50 tracking-wide">
                <Users className="h-3 w-3" />
                <span>{locales.HomePage.hero.socialProof}</span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Reveal direction="none">
        <LogoCloud />
      </Reveal>

      <section className="container mx-auto px-4 py-28 md:py-36">
        <Reveal direction="left">
          <div className="max-w-5xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {locales.HomePage.features.title}
            </h2>
            <p className="mt-3 text-base text-muted-foreground max-w-lg">
              {locales.HomePage.features.subtitle}
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {locales.HomePage.features.items.slice(0, 2).map((feature, index) => {
            const Icon = featureIcons[index];
            return (
              <Reveal
                key={feature.title}
                delay={index * 0.12}
                direction={index === 0 ? "left" : "right"}
              >
                <Card className="h-full transition-colors hover:border-foreground/20 group">
                  <CardContent className="p-8 space-y-5">
                    <div className="inline-flex items-center justify-center rounded-lg bg-foreground text-background p-2.5">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto mt-5">
          {locales.HomePage.features.items.slice(2).map((feature, index) => {
            const Icon = featureIcons[index + 2];
            return (
              <Reveal key={feature.title} delay={0.1 + index * 0.08} direction="up">
                <Card className="h-full transition-colors hover:border-foreground/20">
                  <CardContent className="p-6 space-y-3">
                    <div className="inline-flex items-center justify-center rounded-lg bg-foreground/5 p-2.5">
                      <Icon className="h-4 w-4 text-foreground/60" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight">
                        {feature.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border/40 bg-muted/20">
        <div className="container mx-auto px-4 py-28 md:py-36">
          <Reveal direction="right">
            <div className="max-w-5xl mx-auto mb-16 text-right">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                {locales.HomePage.testimonials.title}
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                {locales.HomePage.testimonials.subtitle}
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {locales.HomePage.testimonials.items.map((testimonial, index) => (
              <Reveal
                key={testimonial.name}
                delay={Math.abs(index - 1) * 0.12}
                direction={index === 0 ? "left" : index === 2 ? "right" : "scale"}
              >
                <TestimonialCard
                  quote={testimonial.quote}
                  name={testimonial.name}
                  role={testimonial.role}
                  initials={testimonial.initials}
                  highlighted={index === 1}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-28 md:py-36">
        <Reveal direction="none">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {locales.HomePage.pricing.title}
            </h2>
            <p className="mt-3 text-base text-muted-foreground max-w-lg mx-auto">
              {locales.HomePage.pricing.subtitle}
            </p>
          </div>
        </Reveal>

        <Reveal direction="scale" delay={0.1}>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {products.map((product) => (
              <PricingCard
                key={product.slug}
                name={product.display.title}
                price={product.display.price}
                period={product.display.period ?? ""}
                billing={product.display.subtitle ?? ""}
                features={product.display.features}
                slug={product.slug}
                badge={product.display.badge || undefined}
                highlighted={product.display.highlighted}
                ctaLabel={product.display.cta}
              />
            ))}
          </div>
        </Reveal>

        <Reveal direction="none" delay={0.25}>
          <div className="flex items-center justify-center gap-2 mt-12 text-xs text-muted-foreground/50 tracking-wide">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{locales.HomePage.pricing.guarantee}</span>
          </div>
        </Reveal>
      </section>

      <section className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 py-28 md:py-36">
          <Reveal direction="up">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                {locales.HomePage.cta.title}
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                {locales.HomePage.cta.subtitle}
              </p>
              <div className="pt-2">
                <Link href={routes.auth.signup}>
                  <Button size="lg" className="gap-2 px-8">
                    {locales.HomePage.cta.button}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
