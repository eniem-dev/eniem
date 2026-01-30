"use client";

import { Button } from "@/components/ui/button";
import { authClient, useSession } from "@/lib/auth-client";
import { locales } from "@/locales";
import { routes } from "@/config";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { appendPlanSelectionToUrl } from "@/lib/plan-selection";
import { logger } from "@/lib/logger";

export interface BuyButtonProps {
  products?: string[];
  slug?: string;
  label?: string;
}

export function BuyButton({ products, slug, label }: BuyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const handleCheckout = async () => {
    if (!session?.user) {
      router.push(appendPlanSelectionToUrl(routes.auth.signup, { slug, products }));
      return;
    }

    try {
      setIsLoading(true);
      await authClient.checkout({ products, slug });
    } catch (error) {
      logger.error("Checkout failed", { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleCheckout} disabled={isLoading} loading={isLoading}>
      {label ?? locales.BuyButton.label}
    </Button>
  );
}
