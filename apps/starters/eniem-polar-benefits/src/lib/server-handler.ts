import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "./auth";
import { logger } from "./logger";
import { locales } from "@/locales";
import { ServerError, UnauthorizedError, ValidationError } from "./errors";

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type ServerResponse<T> = { data: T; error: null } | { data: null; error: string };

type Session = typeof auth.$Infer.Session | null;
type AuthSession = NonNullable<typeof auth.$Infer.Session>;

type HandlerFunction<T, TInput = unknown> = (context: {
  session: Session;
  input?: TInput;
  request?: NextRequest;
}) => Promise<T>;

type AuthenticatedHandlerFunction<T, TInput = unknown> = (context: {
  session: AuthSession;
  user: AuthSession["user"];
  input?: TInput;
  request?: NextRequest;
}) => Promise<T>;

async function handleError(
  error: unknown
): Promise<{ error: string; statusCode: number }> {
  if (error instanceof UnauthorizedError) {
    logger.error("Unauthorized access attempt", { error: error.message });
    return { error: error.message, statusCode: 401 };
  }

  if (error instanceof ValidationError) {
    logger.warn("Validation failed", { error: error.message });
    return { error: error.message, statusCode: 400 };
  }

  if (error instanceof ServerError) {
    logger.error("Server error", { error: error.message, statusCode: error.statusCode });
    return { error: error.message, statusCode: error.statusCode };
  }

  if (error instanceof z.ZodError) {
    const errorMessage = error.issues[0]?.message || locales.errors.validationFailed;
    logger.warn("Zod validation failed", { issues: error.issues });
    return { error: errorMessage, statusCode: 400 };
  }

  if (error instanceof Error) {
    logger.error("Unexpected error", { error: error.message, stack: error.stack });
    return { error: error.message, statusCode: 500 };
  }

  logger.error("Unknown error", { error });
  return { error: locales.errors.unhandledError, statusCode: 500 };
}

async function requireAuth(): Promise<AuthSession> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    throw new UnauthorizedError(locales.errors.unauthorized);
  }
  return session as AuthSession;
}

async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

export async function createQuery<T>(
  handler: HandlerFunction<T>
): Promise<ServerResponse<T>> {
  try {
    const session = await getSession();

    const data = await handler({ session });
    return { data, error: null };
  } catch (error) {
    const { error: errorMessage } = await handleError(error);
    return { data: null, error: errorMessage };
  }
}

export async function createAuthenticatedQuery<T>(
  handler: AuthenticatedHandlerFunction<T>
): Promise<ServerResponse<T>> {
  try {
    const session = await requireAuth();

    const data = await handler({ session, user: session.user });
    return { data, error: null };
  } catch (error) {
    const { error: errorMessage } = await handleError(error);
    return { data: null, error: errorMessage };
  }
}

export async function createApiHandler<T, TInput = unknown>(
  handler: HandlerFunction<T, TInput>,
  options: {
    validate?: z.ZodType<TInput>;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      const session = await getSession();

      let input: TInput | undefined;
      if (options.validate) {
        const body = await request.json();
        input = options.validate.parse(body);
      }

      const data = await handler({ session, input, request });
      return NextResponse.json({ success: true, data });
    } catch (error) {
      const { error: errorMessage, statusCode } = await handleError(error);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: statusCode }
      );
    }
  };
}

export async function createAuthenticatedApiHandler<T, TInput = unknown>(
  handler: AuthenticatedHandlerFunction<T, TInput>,
  options: {
    validate?: z.ZodType<TInput>;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      const session = await requireAuth();

      let input: TInput | undefined;
      if (options.validate) {
        const body = await request.json();
        input = options.validate.parse(body);
      }

      const data = await handler({ session, user: session.user, input, request });
      return NextResponse.json({ success: true, data });
    } catch (error) {
      const { error: errorMessage, statusCode } = await handleError(error);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: statusCode }
      );
    }
  };
}

export function isServerResponseSuccessful<T>(
  response: ServerResponse<T>
): response is { data: T; error: null } {
  return response.error === null && response.data !== null;
}

export function isApiResponseSuccessful<T>(
  response: ApiResponse<T>
): response is { success: true; data: T } {
  return response.success === true;
}
