import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { routes } from "@/config/routes";
import { getBoardByIdQuery } from "@/features/boards/queries/board.query";
import { BoardSettings } from "@/features/boards/components/BoardSettings";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.ManageBoardPage.metadata.title,
  description: locales.ManageBoardPage.metadata.description,
});

type ManageBoardPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ManageBoardPage({ params }: ManageBoardPageProps) {
  const { id } = await params;
  const { data, error } = await getBoardByIdQuery(id);

  if (error || !data?.board) {
    notFound();
  }

  const { board } = data;
  const isDeleted = board.deletedAt !== null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-4xl font-bold">{board.name}</h1>
        {isDeleted && (
          <Badge variant="destructive">
            {locales.BoardsPage.deletedBadge}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{locales.BoardSettings.publicLink}:</span>
        {!isDeleted ? (
          <Link
            href={routes.publicBoard(board.slug)}
            className="font-medium text-primary hover:underline"
          >
            /b/{board.slug}
          </Link>
        ) : (
          <span className="line-through">/b/{board.slug}</span>
        )}
      </div>

      <BoardSettings board={board} />
    </div>
  );
}
