import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { routes } from "@/config/routes";
import { locales } from "@/locales";
import { getSubscriptionQuery } from "@/features/subscription";
import { BoardList } from "@/features/boards/components/BoardList";
import { LapsedSubscriptionBanner } from "@/features/boards/components/LapsedSubscriptionBanner";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.BoardsPage.metadata.title,
  description: locales.BoardsPage.metadata.description,
});

export default async function BoardsPage() {
  const { data: subscription } = await getSubscriptionQuery();
  const isActive = subscription?.status === "active";

  return (
    <div className="space-y-6">
      {!isActive && <LapsedSubscriptionBanner />}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          {locales.BoardsPage.metadata.title}
        </h1>
        {isActive ? (
          <Link href={routes.boards.new} className={buttonVariants()}>
            {locales.BoardsPage.emptyStateCta}
          </Link>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={buttonVariants({ className: "pointer-events-none opacity-50" })}
                aria-disabled="true"
              >
                {locales.BoardsPage.emptyStateCta}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {locales.BoardBilling.disabledCreateBoard}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <Suspense>
        <BoardList />
      </Suspense>
    </div>
  );
}
