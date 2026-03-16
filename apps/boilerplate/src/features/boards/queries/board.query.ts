import { prisma } from "@/lib/db";
import { createAuthenticatedQuery, createQuery } from "@/lib/server-handler";
import type { IdeaStatus } from "@/generated/prisma";

export function getUserBoardsQuery() {
  return createAuthenticatedQuery(async ({ user }) => {
    const boards = await prisma.board.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return { boards };
  });
}

export function getBoardBySlugQuery(
  slug: string,
  options?: { status?: IdeaStatus }
) {
  return createQuery(async ({ session }) => {
    const userId = session?.user?.id;

    const board = await prisma.board.findUnique({
      where: { slug, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        ownerId: true,
      },
    });

    if (!board) {
      return null;
    }

    const ideas = await prisma.idea.findMany({
      where: {
        boardId: board.id,
        ...(options?.status ? { status: options.status } : {}),
      },
      orderBy: [
        { votes: { _count: "desc" } },
        { createdAt: "desc" },
      ],
      include: {
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { votes: true } },
        ...(userId
          ? { votes: { where: { userId }, select: { id: true } } }
          : {}),
      },
    });

    const ideasWithVotes = ideas.map((idea) => ({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      status: idea.status,
      adminResponse: idea.adminResponse,
      createdAt: idea.createdAt,
      author: idea.author,
      voteCount: idea._count.votes,
      hasVoted: "votes" in idea ? idea.votes.length > 0 : false,
    }));

    return {
      board,
      ideas: ideasWithVotes,
      isAuthenticated: !!userId,
      currentUserId: userId ?? null,
    };
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
