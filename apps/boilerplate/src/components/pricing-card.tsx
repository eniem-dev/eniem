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
      className={cn(
        "relative flex flex-col",
        highlighted && "border-foreground/20 shadow-md"
      )}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="default" className="px-3 py-0.5 text-xs">
            {badge}
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4 pt-6">
        <h3 className="text-lg font-bold">{name}</h3>
        <div className="mt-3 flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold tracking-tight">{price}</span>
          <span className="text-sm text-muted-foreground">{period}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">{billing}</p>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <ul className="space-y-2.5">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2.5">
              <Check className="h-4 w-4 text-foreground/50 flex-shrink-0 mt-0.5" />
              <span className="text-sm leading-snug">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-4 justify-center">
        <BuyButton slug={slug} label={ctaLabel} />
      </CardFooter>
    </Card>
  );
}
