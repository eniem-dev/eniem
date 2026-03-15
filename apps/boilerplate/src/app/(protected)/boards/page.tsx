import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { routes } from "@/config/routes";
import { locales } from "@/locales";
import { BoardList } from "@/features/boards/components/BoardList";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.BoardsPage.metadata.title,
  description: locales.BoardsPage.metadata.description,
});

export default function BoardsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          {locales.BoardsPage.metadata.title}
        </h1>
        <Link href={routes.boards.new} className={buttonVariants()}>
          {locales.BoardsPage.emptyStateCta}
        </Link>
      </div>
      <Suspense>
        <BoardList />
      </Suspense>
    </div>
  );
}
