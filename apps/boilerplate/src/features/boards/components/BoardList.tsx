import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { locales } from "@/locales";
import { getUserBoardsQuery } from "../queries/board.query";
import { ErrorCard } from "@/components/error-card";
import { BoardCard } from "./BoardCard";

export async function BoardList() {
  const { data, error } = await getUserBoardsQuery();

  if (error || !data) {
    return <ErrorCard message={error ?? "Failed to load boards"} />;
  }

  const { boards } = data;

  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="mb-4 text-muted-foreground">
          {locales.BoardsPage.emptyState}
        </p>
        <Link href={routes.boards.new} className={buttonVariants()}>
          {locales.BoardsPage.emptyStateCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {boards.map((board) => (
        <BoardCard key={board.id} board={board} />
      ))}
    </div>
  );
}
