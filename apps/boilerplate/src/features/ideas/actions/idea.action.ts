"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { locales } from "@/locales";
import { NotFoundError, UnauthorizedError } from "@/lib/errors";
import { authenticatedActionClient } from "@/lib/safe-action.server";
import {
  createIdeaSchema,
  updateIdeaSchema,
  deleteIdeaSchema,
} from "../schemas/idea.schema";

export const createIdeaAction = authenticatedActionClient
  .inputSchema(createIdeaSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { boardId, title, description } = parsedInput;

    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board || board.deletedAt) {
      throw new NotFoundError(locales.errors.boardNotFound);
    }

    const idea = await prisma.idea.create({
      data: {
        title,
        description: description || null,
        boardId,
        authorId: user.id,
      },
    });

    revalidatePath(`/b/${board.slug}`);

    return { idea };
  });

export const updateIdeaAction = authenticatedActionClient
  .inputSchema(updateIdeaSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { ideaId, ...data } = parsedInput;

    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: { board: { select: { slug: true } } },
    });
    if (!idea) {
      throw new NotFoundError(locales.errors.ideaNotFound);
    }
    if (idea.authorId !== user.id) {
      throw new UnauthorizedError(locales.errors.unauthorized);
    }

    const updated = await prisma.idea.update({
      where: { id: ideaId },
      data: {
        ...data,
        description: data.description || null,
      },
    });

    revalidatePath(`/b/${idea.board.slug}`);

    return { idea: updated };
  });

export const deleteIdeaAction = authenticatedActionClient
  .inputSchema(deleteIdeaSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { ideaId } = parsedInput;

    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: { board: { select: { slug: true, ownerId: true } } },
    });
    if (!idea) {
      throw new NotFoundError(locales.errors.ideaNotFound);
    }
    if (idea.authorId !== user.id && idea.board.ownerId !== user.id) {
      throw new UnauthorizedError(locales.errors.unauthorized);
    }

    await prisma.idea.delete({ where: { id: ideaId } });

    revalidatePath(`/b/${idea.board.slug}`);

    return { success: true };
  });
