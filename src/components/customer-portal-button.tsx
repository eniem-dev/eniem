"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export interface CustomerPortalButtonProps {
  label: string;
}

export function CustomerPortalButton({ label }: CustomerPortalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      await authClient.customer.portal();
    } catch (error) {
      console.error("Failed to open customer portal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={isLoading} loading={isLoading}>
      {label}
    </Button>
  );
}
