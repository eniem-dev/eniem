import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { routes } from "@/config/routes";
import { getBoardByIdQuery } from "@/features/boards/queries/board.query";
import { BoardSettings } from "@/features/boards/components/BoardSettings";
import { IdeaAdminList } from "@/features/ideas/components/IdeaAdminList";

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

  const { board, ideas } = data;
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

      <div className="flex gap-6 rounded-lg border bg-muted/50 p-4">
        <div className="text-center">
          <p className="text-2xl font-bold">{board._count?.ideas ?? 0}</p>
          <p className="text-sm text-muted-foreground">{locales.BoardSettings.statsIdeas}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{board._count?.votes ?? 0}</p>
          <p className="text-sm text-muted-foreground">{locales.BoardSettings.statsVotes}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">{locales.BoardSettings.statsIdeas}</h2>
        <IdeaAdminList ideas={ideas} />
      </div>

      <BoardSettings board={board} />
    </div>
  );
}
