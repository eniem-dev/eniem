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
      include: {
        ideas: {
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, name: true } },
            _count: { select: { votes: true } },
          },
        },
        _count: { select: { ideas: true } },
      },
    });

    if (!board || board.ownerId !== user.id) {
      return { board: null };
    }

    const voteCount = board.ideas.reduce((sum, idea) => sum + idea._count.votes, 0);

    const ideas = board.ideas.map((idea) => ({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      status: idea.status,
      adminResponse: idea.adminResponse,
      createdAt: idea.createdAt,
      author: idea.author,
      voteCount: idea._count.votes,
    }));

    return {
      board: {
        ...board,
        ideas: undefined,
        _count: { ideas: board._count.ideas, votes: voteCount },
      },
      ideas,
    };
  });
}
