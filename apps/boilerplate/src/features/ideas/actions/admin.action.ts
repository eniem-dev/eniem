"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { locales } from "@/locales";
import { NotFoundError, UnauthorizedError, ValidationError } from "@/lib/errors";
import { authenticatedActionClient } from "@/lib/safe-action.server";
import { hasActiveSubscription } from "@/features/subscription/services/subscription.service";
import {
  updateIdeaStatusSchema,
  setAdminResponseSchema,
} from "../schemas/admin.schema";

export const updateIdeaStatusAction = authenticatedActionClient
  .inputSchema(updateIdeaStatusSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { ideaId, status } = parsedInput;

    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: { board: { select: { ownerId: true, slug: true } } },
    });
    if (!idea) {
      throw new NotFoundError(locales.errors.ideaNotFound);
    }
    if (idea.board.ownerId !== user.id) {
      throw new UnauthorizedError(locales.errors.unauthorized);
    }

    const subscribed = await hasActiveSubscription(user.id);
    if (!subscribed) {
      throw new ValidationError(locales.errors.subscriptionRequired);
    }

    await prisma.idea.update({
      where: { id: ideaId },
      data: { status },
    });

    revalidatePath(`/b/${idea.board.slug}`);
    revalidatePath(`/boards/${idea.boardId}`);

    return { success: true };
  });

export const setAdminResponseAction = authenticatedActionClient
  .inputSchema(setAdminResponseSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { ideaId, response } = parsedInput;

    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: { board: { select: { ownerId: true, slug: true } } },
    });
    if (!idea) {
      throw new NotFoundError(locales.errors.ideaNotFound);
    }
    if (idea.board.ownerId !== user.id) {
      throw new UnauthorizedError(locales.errors.unauthorized);
    }

    const subscribed = await hasActiveSubscription(user.id);
    if (!subscribed) {
      throw new ValidationError(locales.errors.subscriptionRequired);
    }

    await prisma.idea.update({
      where: { id: ideaId },
      data: { adminResponse: response },
    });

    revalidatePath(`/b/${idea.board.slug}`);
    revalidatePath(`/boards/${idea.boardId}`);

    return { success: true };
  });
