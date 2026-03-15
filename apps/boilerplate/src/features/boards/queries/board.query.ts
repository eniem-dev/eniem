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
