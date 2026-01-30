import { createAuthenticatedQuery } from "@/lib/server-handler";
import { getUserSubscription } from "../services/subscription.service";

export const getSubscriptionQuery = () =>
  createAuthenticatedQuery(async ({ user }) => {
    return getUserSubscription(user.id);
  });
