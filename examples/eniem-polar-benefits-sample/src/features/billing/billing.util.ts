export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getSubscriptionStatusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "active":
      return "default";
    case "canceled":
    case "past_due":
      return "destructive";
    case "trialing":
      return "secondary";
    default:
      return "outline";
  }
}

export function getOrderStatusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "paid":
      return "default";
    case "pending":
      return "secondary";
    case "refunded":
      return "outline";
    default:
      return "outline";
  }
}
