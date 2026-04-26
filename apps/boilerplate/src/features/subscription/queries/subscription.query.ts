import { authed } from "@/lib/handler";
import { getUserSubscription } from "../services/subscription.service";

export const getSubscriptionQuery = () =>
  authed.query(async ({ user }) => {
    return getUserSubscription(user.id);
  });
