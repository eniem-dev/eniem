"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { locales } from "@/locales";
import { NotFoundError } from "@/lib/errors";
import { authenticatedActionClient } from "@/lib/safe-action.server";
import { toggleVoteSchema } from "../schemas/vote.schema";

export const toggleVoteAction = authenticatedActionClient
  .inputSchema(toggleVoteSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { ideaId } = parsedInput;

    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: { board: { select: { slug: true, deletedAt: true } } },
    });

    if (!idea || idea.board.deletedAt) {
      throw new NotFoundError(locales.errors.voteIdeaNotFound);
    }

    const existingVote = await prisma.vote.findUnique({
      where: { ideaId_userId: { ideaId, userId: user.id } },
    });

    if (existingVote) {
      await prisma.vote.delete({ where: { id: existingVote.id } });
    } else {
      await prisma.vote.create({
        data: { ideaId, userId: user.id },
      });
    }

    const count = await prisma.vote.count({ where: { ideaId } });

    revalidatePath(`/b/${idea.board.slug}`);

    return { voted: !existingVote, count };
  });
