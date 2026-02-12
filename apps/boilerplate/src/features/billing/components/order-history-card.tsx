import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BillingOrder } from "../models/billing.model";
import { locales } from "@/locales";
import {
  formatCurrency,
  formatShortDate,
  getOrderStatusBadgeVariant,
} from "../billing.util";

interface OrderHistoryCardProps {
  orders: BillingOrder[];
}

export function OrderHistoryCard({ orders }: OrderHistoryCardProps) {
  const l = locales.BillingOverview.orderHistoryCard;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{l.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-muted-foreground">{l.noOrders}</p>
        ) : (
          <>
            {/* Desktop table view */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 pr-4 text-sm font-medium text-muted-foreground">
                        {l.columns.date}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        {l.columns.description}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        {l.columns.amount}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        {l.columns.status}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const statusLabel =
                        l.status[order.status as keyof typeof l.status] ||
                        order.status;
                      return (
                        <tr key={order.id} className="border-b last:border-b-0">
                          <td className="py-4 pr-4 text-sm">
                            {formatShortDate(order.createdAt)}
                          </td>
                          <td className="py-4 px-4 text-sm">
                            {order.productName || order.description}
                          </td>
                          <td className="py-4 px-4 text-sm font-medium">
                            {formatCurrency(order.totalAmount, order.currency)}
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={getOrderStatusBadgeVariant(order.status)}>
                              {statusLabel}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden space-y-4">
              {orders.map((order) => {
                const statusLabel =
                  l.status[order.status as keyof typeof l.status] ||
                  order.status;
                return (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {formatShortDate(order.createdAt)}
                      </span>
                      <Badge variant={getOrderStatusBadgeVariant(order.status)}>
                        {statusLabel}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {l.columns.description}
                      </p>
                      <p className="text-sm">
                        {order.productName || order.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {l.columns.amount}
                        </p>
                        <p className="text-sm font-medium">
                          {formatCurrency(order.totalAmount, order.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
