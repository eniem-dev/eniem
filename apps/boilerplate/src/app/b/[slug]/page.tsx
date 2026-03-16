import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDefaultMetadata, createMetadata } from "@/lib/metadata";
import { getBoardBySlugQuery } from "@/features/boards/queries/board.query";
import { PublicBoardView } from "@/features/boards/components/PublicBoardView";
import { routes } from "@/config/routes";
import type { IdeaStatus } from "@/generated/prisma";

type PublicBoardPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string }>;
};

const VALID_STATUSES = new Set(["OPEN", "PLANNED", "DONE"]);

export async function generateMetadata({
  params,
}: PublicBoardPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await getBoardBySlugQuery(slug);

  if (!data) {
    return createMetadata({
      ...getDefaultMetadata(),
      title: "Board Not Found",
    });
  }

  return createMetadata({
    ...getDefaultMetadata(),
    title: `${data.board.name} — Feedback Board`,
    description: data.board.description || undefined,
  });
}

export default async function PublicBoardPage({
  params,
  searchParams,
}: PublicBoardPageProps) {
  const { slug } = await params;
  const { status } = await searchParams;

  const statusFilter = status && VALID_STATUSES.has(status)
    ? (status as IdeaStatus)
    : undefined;

  const { data, error } = await getBoardBySlugQuery(slug, {
    status: statusFilter,
  });

  if (error || !data) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PublicBoardView
        board={data.board}
        ideas={data.ideas}
        isAuthenticated={data.isAuthenticated}
        currentUserId={data.currentUserId}
        loginUrl={routes.auth.login}
        activeStatus={statusFilter ?? null}
      />
    </div>
  );
}
