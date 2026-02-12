import Link from "next/link";
import type { CreditBalance as CreditBalanceType } from "../models/credits.model";
import { Skeleton } from "@/components/ui/skeleton";
import { locales } from "@/locales";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";

interface CreditBalanceProps {
  balance: CreditBalanceType | null;
  isLoading?: boolean;
  hasCustomer?: boolean;
  showUpgradePrompt?: boolean;
  error?: Error | null;
  className?: string;
}

export function CreditBalance({
  balance,
  isLoading,
  hasCustomer = true,
  showUpgradePrompt,
  error,
  className,
}: CreditBalanceProps) {
  // Loading state
  if (isLoading) {
    return <Skeleton className={cn("h-4 w-20", className)} />;
  }

  // Error state - silent fail
  if (error) {
    return <span className={className}>{locales.CreditBalance.error}</span>;
  }

  // No customer/subscription state
  if (!hasCustomer) {
    return (
      <Link
        href={routes.pricing}
        className={cn("text-muted-foreground hover:underline", className)}
      >
        {locales.CreditBalance.noSubscription}
      </Link>
    );
  }

  // No balance data (shouldn't happen with customer, but fallback)
  if (!balance) {
    return null;
  }

  const credits = balance.balance;
  const isZero = credits === 0;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span>
        {isZero
          ? locales.CreditBalance.zeroCredits
          : locales.CreditBalance.creditsLabel.replace("{count}", String(credits))}
      </span>
      {isZero && showUpgradePrompt && (
        <Link
          href={routes.pricing}
          className="text-primary hover:underline text-sm"
        >
          {locales.CreditBalance.upgradePrompt}
        </Link>
      )}
    </span>
  );
}
