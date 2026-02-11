"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { BuyButton } from "./buy-button";
import { cn } from "@/lib/utils";

export interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  billing: string;
  features: readonly string[];
  slug: string;
  badge?: string;
  highlighted?: boolean;
  ctaLabel: string;
}

export function PricingCard({
  name,
  price,
  period,
  billing,
  features,
  slug,
  badge,
  highlighted = false,
  ctaLabel,
}: PricingCardProps) {
  return (
    <Card
      className={cn("relative flex flex-col", highlighted && "border-primary shadow-lg")}
    >
      {badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge variant="default" className="px-3 py-1">
            {badge}
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-8 pt-8">
        <h3 className="text-2xl font-bold">{name}</h3>
        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className="text-5xl font-bold tracking-tight">{price}</span>
          <span className="text-muted-foreground">{period}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{billing}</p>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-6">
        <BuyButton slug={slug} label={ctaLabel} />
      </CardFooter>
    </Card>
  );
}
