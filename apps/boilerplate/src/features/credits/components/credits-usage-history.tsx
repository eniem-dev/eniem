"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { locales } from "@/locales";
import { formatShortDate } from "@/features/billing/billing.util";
import type { UsageHistoryEvent, UsageHistoryResult } from "../models/credits.model";
import type { ApiResponse } from "@/lib/server-handler";
import { MetadataTooltip } from "./metadata-tooltip";

interface CreditsUsageHistoryProps {
  initialEvents: UsageHistoryEvent[];
  initialMaxPage: number;
}

async function fetchUsagePage(page: number): Promise<UsageHistoryResult> {
  const response = await fetch(`/api/credits/usage?page=${page}`);
  if (!response.ok) throw new Error("Failed to load usage history");

  const json: ApiResponse<UsageHistoryResult> = await response.json();
  if (!json.success) throw new Error(json.error);

  return json.data;
}

export function CreditsUsageHistory({
  initialEvents,
  initialMaxPage,
}: CreditsUsageHistoryProps) {
  const l = locales.UsageHistoryPage;
  const cl = locales.CreditsUsageHistory;

  const initialData = {
    pages: [
      {
        events: initialEvents,
        pagination: { totalCount: 0, maxPage: initialMaxPage, currentPage: 1 },
      },
    ],
    pageParams: [1],
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["credits-usage-history"],
    queryFn: ({ pageParam }) => fetchUsagePage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.currentPage < lastPage.pagination.maxPage
        ? lastPage.pagination.currentPage + 1
        : undefined,
    initialData,
    staleTime: 60 * 1000,
  });

  const events = data?.pages.flatMap((page) => page.events) ?? [];

  if (events.length === 0) {
    return <p className="text-muted-foreground">{cl.emptyState}</p>;
  }

  return (
    <div className="space-y-4">
      {/* Desktop table view */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 pr-4 text-sm font-medium text-muted-foreground w-3/4">
                  {cl.columns.event}
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-1/4">
                  {cl.columns.date}
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b last:border-b-0">
                  <td className="py-4 pr-4 text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      {event.name}
                      <MetadataTooltip metadata={event.metadata} />
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm">
                    {formatShortDate(event.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {events.map((event) => (
          <div key={event.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium inline-flex items-center gap-1.5">
                {event.name}
                <MetadataTooltip metadata={event.metadata} />
              </span>
              <span className="text-sm text-muted-foreground">
                {formatShortDate(event.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            loading={isFetchingNextPage}
          >
            {l.loadMore}
          </Button>
        </div>
      )}
    </div>
  );
}
