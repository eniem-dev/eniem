import { prisma } from "@/lib/db";
import { createAuthenticatedQuery } from "@/lib/server-handler";

export function getUserBoardsQuery() {
  return createAuthenticatedQuery(async ({ user }) => {
    const boards = await prisma.board.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return { boards };
  });
}

export function getBoardByIdQuery(boardId: string) {
  return createAuthenticatedQuery(async ({ user }) => {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board || board.ownerId !== user.id) {
      return { board: null };
    }

    return { board: { ...board, _count: { ideas: 0, votes: 0 } } };
  });
}
