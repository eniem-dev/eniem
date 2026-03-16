import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { polarClient } from "@/lib/polar";
import type { PolarSubscription } from "../models/subscription.model";

// === Query functions ===

export async function getUserSubscription(userId: string) {
  return prisma.subscription.findUnique({
    where: { userId },
  });
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const sub = await getUserSubscription(userId);
  if (!sub || sub.status !== "active") return false;
  return sub.currentPeriodEnd > new Date();
}

// === Sync functions (called from webhooks) ===

export async function syncSubscription(
  userId: string,
  activeSubscriptions: PolarSubscription[]
) {
  if (activeSubscriptions.length > 0) {
    const sub = activeSubscriptions[0];

    logger.info("Syncing subscription", { sub });

    // Guard against missing required dates
    if (!sub.currentPeriodStart || !sub.currentPeriodEnd || !sub.startedAt) {
      logger.error("Subscription missing required dates", { userId, sub });
      return;
    }

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        polarSubscriptionId: sub.id,
        polarProductId: sub.productId,
        status: sub.status,
        recurringInterval: sub.recurringInterval,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        canceledAt: sub.canceledAt,
        startedAt: sub.startedAt,
        amount: sub.amount,
        currency: sub.currency,
      },
      update: {
        polarSubscriptionId: sub.id,
        polarProductId: sub.productId,
        status: sub.status,
        recurringInterval: sub.recurringInterval,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        canceledAt: sub.canceledAt,
        startedAt: sub.startedAt,
        amount: sub.amount,
        currency: sub.currency,
      },
    });

    logger.info("Subscription synced", { userId, status: sub.status });
  } else {
    await deleteSubscription(userId);
  }
}

export async function deleteSubscription(userId: string) {
  await prisma.subscription.deleteMany({
    where: { userId },
  });

  logger.info("Subscription removed", { userId });
}

// === Direct Polar API sync (for success page) ===

export async function syncSubscriptionFromPolar(userId: string) {
  const customerState = await polarClient.customers.getStateExternal({
    externalId: userId,
  });

  await syncSubscription(
    userId,
    (customerState.activeSubscriptions as PolarSubscription[]) || []
  );

  return customerState;
}
