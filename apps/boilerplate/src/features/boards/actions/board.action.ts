"use server";

import { prisma } from "@/lib/db";
import { locales } from "@/locales";
import { ValidationError } from "@/lib/errors";
import { authenticatedActionClient } from "@/lib/safe-action.server";
import { hasActiveSubscription } from "@/features/subscription/services/subscription.service";
import { createBoardSchema } from "../schemas/board.schema";

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
