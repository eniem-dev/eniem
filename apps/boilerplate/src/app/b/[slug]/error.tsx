"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { locales } from "@/locales";

export default function BoardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-muted-foreground">
        {locales.PublicBoardView.networkError}
      </p>
      <Button variant="outline" onClick={() => reset()}>
        <RotateCcw className="mr-2 size-4" />
        {locales.ErrorPage.tryAgain}
      </Button>
    </div>
  );
}
