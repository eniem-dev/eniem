"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { locales } from "@/locales";
import { NotFoundError, UnauthorizedError, ValidationError } from "@/lib/errors";
import { authenticatedActionClient } from "@/lib/safe-action.server";
import { hasActiveSubscription } from "@/features/subscription/services/subscription.service";
import {
  createBoardSchema,
  updateBoardSchema,
  deleteBoardSchema,
  restoreBoardSchema,
} from "../schemas/board.schema";

export const createBoardAction = authenticatedActionClient
  .inputSchema(createBoardSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { name, slug, description } = parsedInput;

    const subscribed = await hasActiveSubscription(user.id);
    if (!subscribed) {
      throw new ValidationError(locales.errors.subscriptionRequired);
    }

    const existing = await prisma.board.findUnique({ where: { slug } });
    if (existing) {
      throw new ValidationError(locales.errors.slugTaken);
    }

    const board = await prisma.board.create({
      data: { name, slug, description, ownerId: user.id },
    });

    return { board };
  });

export const updateBoardAction = authenticatedActionClient
  .inputSchema(updateBoardSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { boardId, ...data } = parsedInput;

    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      throw new NotFoundError(locales.errors.boardNotFound);
    }
    if (board.ownerId !== user.id) {
      throw new UnauthorizedError(locales.errors.unauthorized);
    }

    const updated = await prisma.board.update({
      where: { id: boardId },
      data,
    });

    revalidatePath(`/boards/${boardId}`);

    return { board: updated };
  });

export const deleteBoardAction = authenticatedActionClient
  .inputSchema(deleteBoardSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { boardId } = parsedInput;

    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      throw new NotFoundError(locales.errors.boardNotFound);
    }
    if (board.ownerId !== user.id) {
      throw new UnauthorizedError(locales.errors.unauthorized);
    }

    const deleted = await prisma.board.update({
      where: { id: boardId },
      data: { deletedAt: new Date() },
    });

    return { board: deleted };
  });

export const restoreBoardAction = authenticatedActionClient
  .inputSchema(restoreBoardSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { boardId } = parsedInput;

    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      throw new NotFoundError(locales.errors.boardNotFound);
    }
    if (board.ownerId !== user.id) {
      throw new UnauthorizedError(locales.errors.unauthorized);
    }

    const restored = await prisma.board.update({
      where: { id: boardId },
      data: { deletedAt: null },
    });

    return { board: restored };
  });
