import { createSafeActionClient } from "next-safe-action";
import { headers } from "next/headers";
import { auth } from "./auth";
import { logger } from "./logger";
import { locales } from "@/locales";
import { ServerError, UnauthorizedError, ValidationError } from "./errors";

export const actionClient = createSafeActionClient({
  handleServerError: async (error) => {
    if (error instanceof UnauthorizedError) {
      logger.error("Unauthorized action attempt", { error: error.message });
      return error.message;
    }

    if (error instanceof ValidationError) {
      logger.warn("Action validation failed", { error: error.message });
      return error.message;
    }

    if (error instanceof ServerError) {
      logger.error("Server action error", {
        error: error.message,
        statusCode: error.statusCode,
      });
      return error.message;
    }

    if (error instanceof Error) {
      logger.error("Unexpected action error", {
        error: error.message,
        stack: error.stack,
      });
      return error.message;
    }

    logger.error("Unknown action error", { error });
    return locales.errors.unhandledError;
  },
});

export const authenticatedActionClient = actionClient.use(async ({ next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    logger.warn("Attempted authenticated action without session");
    throw new UnauthorizedError(locales.errors.unauthorized);
  }

  return next({ ctx: { session, user: session.user } });
});
