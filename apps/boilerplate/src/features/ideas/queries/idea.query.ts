import { prisma } from "@/lib/db";
import { createAuthenticatedQuery } from "@/lib/server-handler";

export function getIdeasByBoardQuery(boardId: string) {
  return createAuthenticatedQuery(async ({ user }) => {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      return { ideas: [] };
    }

    const ideas = await prisma.idea.findMany({
      where: { boardId },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return { ideas, isOwner: board.ownerId === user.id };
  });
}

export function getIdeaByIdQuery(ideaId: string) {
  return createAuthenticatedQuery(async ({ user }) => {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        author: { select: { id: true, name: true, image: true } },
        board: { select: { id: true, ownerId: true } },
      },
    });

    if (!idea) {
      return { idea: null };
    }

    return {
      idea: {
        ...idea,
        isAuthor: idea.authorId === user.id,
        isBoardOwner: idea.board.ownerId === user.id,
      },
    };
  });
}
