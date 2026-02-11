"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { locales } from "@/locales";
import { useEffect, useState } from "react";
import { CheckIcon, X } from "lucide-react";

export function SuccessBanner() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const checkoutId = searchParams.get("checkout_id");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (success === "true") {
      setShow(true);
    }
  }, [success]);

  if (!show) return null;

  return (
    <Card className="relative border-green-500 bg-green-50 dark:bg-green-950">
      <button
        onClick={() => setShow(false)}
        className="absolute right-4 top-4 text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
      >
        <X className="h-5 w-5" />
      </button>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white">
            <CheckIcon className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-green-900 dark:text-green-100">
              {locales.SuccessBanner.title}
            </CardTitle>

            <p className="text-sm text-green-800 dark:text-green-200 mt-2">
              {locales.SuccessBanner.description}
            </p>

            {checkoutId && (
              <p className="mt-2 text-xs text-green-700 dark:text-green-300">
                {locales.SuccessBanner.checkoutId}: {checkoutId}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
