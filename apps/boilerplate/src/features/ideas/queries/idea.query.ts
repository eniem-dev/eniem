import { prisma } from "@/lib/db";
import { createAuthenticatedQuery, createQuery } from "@/lib/server-handler";

export function getIdeasByBoardQuery(boardId: string) {
  return createQuery(async ({ session }) => {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      return { ideas: [], isOwner: false };
    }

    const userId = session?.user?.id;

    const ideas = await prisma.idea.findMany({
      where: { boardId },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { votes: true } },
        ...(userId
          ? { votes: { where: { userId }, select: { id: true } } }
          : {}),
      },
    });

    const ideasWithVotes = ideas.map((idea) => ({
      ...idea,
      voteCount: idea._count.votes,
      hasVoted: "votes" in idea ? idea.votes.length > 0 : false,
      _count: undefined,
      votes: undefined,
    }));

    return { ideas: ideasWithVotes, isOwner: board.ownerId === userId };
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
