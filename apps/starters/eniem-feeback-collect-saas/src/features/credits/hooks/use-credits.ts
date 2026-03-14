"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "@/lib/server-handler";
import type { CreditBalance } from "../models/credits.model";
import type { CreditsData } from "@/app/api/credits/[meterId]/route";

interface UseCreditsResult {
  balance: CreditBalance | null;
  hasCustomer: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

async function fetchCredits(meterId: string): Promise<ApiResponse<CreditsData>> {
  const response = await fetch(`/api/credits/${meterId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch credits");
  }
  return response.json();
}

/**
 * Hook to fetch and manage credit balance state.
 *
 * Uses react-query for caching, refetching on focus, and error handling.
 *
 * @param meterId - The Polar meter identifier to fetch balance for
 * @returns Object with balance, hasCustomer, isLoading, error, and refetch function
 *
 * @example
 * ```tsx
 * function CreditDisplay() {
 *   const { balance, hasCustomer, isLoading, error } = useCredits("meter_123");
 *
 *   if (isLoading) return <Spinner />;
 *   if (!hasCustomer) return <SubscribePrompt />;
 *   return <span>{balance?.balance} credits</span>;
 * }
 * ```
 */
export function useCredits(meterId: string): UseCreditsResult {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["credits", meterId],
    queryFn: () => fetchCredits(meterId),
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
  });

  return {
    balance: data?.success ? data.data.balance : null,
    hasCustomer: data?.success ? data.data.hasCustomer : false,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
