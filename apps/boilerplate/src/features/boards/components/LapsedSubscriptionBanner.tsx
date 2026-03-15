"use client";

import { AlertCircle } from "lucide-react";
import { CustomerPortalButton } from "@/components/customer-portal-button";
import { locales } from "@/locales";

export function LapsedSubscriptionBanner() {
  const l = locales.BoardBilling.renewalBanner;

  return (
    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <p className="text-sm text-amber-800 dark:text-amber-200">{l.text}</p>
        <CustomerPortalButton label={l.cta} />
      </div>
    </div>
  );
}
