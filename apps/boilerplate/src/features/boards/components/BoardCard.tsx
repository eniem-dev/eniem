import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { routes } from "@/config/routes";
import { locales } from "@/locales";
import type { Board } from "@/generated/prisma";

type BoardCardProps = {
  board: Board;
};

export function BoardCard({ board }: BoardCardProps) {
  const isDeleted = board.deletedAt !== null;

  return (
    <Card className={isDeleted ? "opacity-60" : undefined}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{board.name}</CardTitle>
          {isDeleted && (
            <Badge variant="destructive">
              {locales.BoardsPage.deletedBadge}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {board.description && (
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            {board.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>0 {locales.BoardCard.ideas}</span>
            <span>0 {locales.BoardCard.votes}</span>
          </div>
          {!isDeleted && (
            <Link
              href={routes.boards.manage(board.id)}
              className="text-sm font-medium text-primary hover:underline"
            >
              {locales.BoardCard.viewBoard}
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
