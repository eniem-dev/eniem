import type { BillingData } from "../models/billing.model";
import { SubscriptionStatusCard } from "./subscription-status-card";
import { OrderHistoryCard } from "./order-history-card";

interface BillingOverviewProps {
  data: BillingData;
}

export function BillingOverview({ data }: BillingOverviewProps) {
  return (
    <div className="space-y-8">
      <SubscriptionStatusCard subscription={data.subscription} />
      <OrderHistoryCard orders={data.orders} />
    </div>
  );
}
