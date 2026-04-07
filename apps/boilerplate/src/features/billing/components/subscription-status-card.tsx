"use client";

import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerPortalButton } from "@/components/customer-portal-button";
import type { SubscriptionResult } from "@/features/subscription";
import { locales } from "@/locales";
import {
  formatCurrency,
  formatDate,
  getSubscriptionStatusBadgeVariant,
} from "../billing.util";

interface SubscriptionStatusCardProps {
  subscription: SubscriptionResult | null;
}

export function SubscriptionStatusCard({
  subscription,
}: SubscriptionStatusCardProps) {
  const l = locales.BillingOverview.subscriptionCard;

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{l.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{l.noSubscription}</p>
        </CardContent>
      </Card>
    );
  }

  const statusLabel =
    l.status[subscription.status as keyof typeof l.status] ||
    subscription.status;
  const periodLabel =
    subscription.recurringInterval === "year" ? l.perYear : l.perMonth;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {l.title}
          <Badge variant={getSubscriptionStatusBadgeVariant(subscription.status)}>
            {statusLabel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">
            {formatCurrency(subscription.amount, subscription.currency)}
          </span>
          <span className="text-muted-foreground">{periodLabel}</span>
        </div>

        {subscription.cancelAtPeriodEnd ? (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-amber-800 dark:text-amber-200">
                {l.cancelNotice}
              </p>
              <p className="text-amber-600 dark:text-amber-400 mt-1">
                {l.cancelsOn} {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {l.renewsOn} {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>
        )}

        <div className="pt-2">
          <CustomerPortalButton label={l.manageSubscription} />
        </div>
      </CardContent>
    </Card>
  );
}
