import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { createSafeActionClient } from "next-safe-action";

import { auth } from "./auth/config";
import { logger } from "./logger";
import { locales } from "@/locales";
import { ServerError, UnauthorizedError, ValidationError } from "./errors";

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: string };

type Session = typeof auth.$Infer.Session | null;
type AuthSession = NonNullable<typeof auth.$Infer.Session>;

export type ClassifiedError = {
  status: number;
  message: string;
  logLevel: "warn" | "error";
};

export function classifyError(error: unknown): ClassifiedError {
  if (error instanceof UnauthorizedError) {
    return { status: 401, message: error.message, logLevel: "warn" };
  }
  if (error instanceof ValidationError) {
    return { status: 400, message: error.message, logLevel: "warn" };
  }
  if (error instanceof ServerError) {
    return {
      status: error.statusCode,
      message: error.message,
      logLevel: "error",
    };
  }
  if (error instanceof z.ZodError) {
    const issue = error.issues[0];
    return {
      status: 400,
      message: issue?.message ?? locales.errors.validationFailed,
      logLevel: "warn",
    };
  }
  if (error instanceof Error) {
    return { status: 500, message: error.message, logLevel: "error" };
  }
  return {
    status: 500,
    message: locales.errors.unhandledError,
    logLevel: "error",
  };
}

function logClassified(classified: ClassifiedError, error: unknown): void {
  const stack = error instanceof Error ? error.stack : undefined;
  if (classified.logLevel === "warn") {
    logger.warn(classified.message, { status: classified.status });
  } else {
    logger.error(classified.message, { status: classified.status, stack });
  }
}

export async function resolveSession(): Promise<Session> {
  return auth.api.getSession({ headers: await headers() });
}

async function resolveSessionOrThrow(): Promise<AuthSession> {
  const session = await resolveSession();
  if (!session?.user) {
    throw new UnauthorizedError(locales.errors.unauthorized);
  }
  return session;
}

export type RouteContext = {
  params: Promise<Record<string, string | string[]>>;
};

export type AuthedCtx<I> = {
  user: AuthSession["user"];
  session: AuthSession;
  input: I;
};

export type PublicCtx<I> = {
  user: null;
  session: Session;
  input: I;
};

type AuthedRouteCtx<I> = AuthedCtx<I> & {
  request: NextRequest;
  context: RouteContext;
};

type PublicRouteCtx<I> = PublicCtx<I> & {
  request: NextRequest;
  context: RouteContext;
};

type RouteHandler<R> = (
  request: NextRequest,
  context: RouteContext
) => Promise<NextResponse<ApiResponse<R>>>;

async function parseRequestInput<S extends z.ZodType>(
  request: NextRequest,
  schema: S
): Promise<z.infer<S>> {
  if (request.method === "GET") {
    const entries = Object.fromEntries(request.nextUrl.searchParams.entries());
    return schema.parse(entries);
  }
  const body = await request.json().catch(() => {
    throw new ValidationError(locales.errors.invalidJsonBody);
  });
  return schema.parse(body);
}

async function runQuery<R>(fn: () => Promise<R>): Promise<Result<R>> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    const classified = classifyError(error);
    logClassified(classified, error);
    return { data: null, error: classified.message };
  }
}

async function runRoute<R>(
  fn: () => Promise<R>
): Promise<NextResponse<ApiResponse<R>>> {
  try {
    const data = await fn();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const classified = classifyError(error);
    logClassified(classified, error);
    return NextResponse.json<ApiResponse<R>>(
      { success: false, error: classified.message },
      { status: classified.status }
    );
  }
}

function handleActionError(error: unknown): string {
  const classified = classifyError(error);
  logClassified(classified, error);
  return classified.message;
}

export const authed_client = createSafeActionClient({
  handleServerError: async (error) => handleActionError(error),
}).use(async ({ next }) => {
  const session = await resolveSessionOrThrow();
  return next({ ctx: { session, user: session.user } });
});

const publicly_client = createSafeActionClient({
  handleServerError: async (error) => handleActionError(error),
});

class AuthedValidated<S extends z.ZodType> {
  constructor(private readonly schema: S) {}

  route<R>(
    fn: (ctx: AuthedRouteCtx<z.infer<S>>) => Promise<R>
  ): RouteHandler<R> {
    const schema = this.schema;
    return (request, context) =>
      runRoute(async () => {
        const input = await parseRequestInput(request, schema);
        const session = await resolveSessionOrThrow();
        return fn({ user: session.user, session, input, request, context });
      });
  }

  action<R>(fn: (ctx: AuthedCtx<z.infer<S>>) => Promise<R>) {
    const schema = this.schema;
    return authed_client
      .inputSchema(schema)
      .action(async ({ parsedInput, ctx }) => {
        const input: z.infer<S> = schema.parse(parsedInput);
        return fn({ user: ctx.user, session: ctx.session, input });
      });
  }
}

class PublicValidated<S extends z.ZodType> {
  constructor(private readonly schema: S) {}

  route<R>(
    fn: (ctx: PublicRouteCtx<z.infer<S>>) => Promise<R>
  ): RouteHandler<R> {
    const schema = this.schema;
    return (request, context) =>
      runRoute(async () => {
        const input = await parseRequestInput(request, schema);
        const session = await resolveSession();
        return fn({ user: null, session, input, request, context });
      });
  }

  action<R>(fn: (ctx: PublicCtx<z.infer<S>>) => Promise<R>) {
    const schema = this.schema;
    return publicly_client
      .inputSchema(schema)
      .action(async ({ parsedInput }) => {
        const input: z.infer<S> = schema.parse(parsedInput);
        return fn({ user: null, session: null, input });
      });
  }
}

class AuthedRoot {
  input<S extends z.ZodType>(schema: S): AuthedValidated<S> {
    return new AuthedValidated<S>(schema);
  }

  query<R>(fn: (ctx: AuthedCtx<void>) => Promise<R>): Promise<Result<R>> {
    return runQuery(async () => {
      const session = await resolveSessionOrThrow();
      return fn({ user: session.user, session, input: undefined });
    });
  }

  route<R>(fn: (ctx: AuthedRouteCtx<void>) => Promise<R>): RouteHandler<R> {
    return (request, context) =>
      runRoute(async () => {
        const session = await resolveSessionOrThrow();
        return fn({
          user: session.user,
          session,
          input: undefined,
          request,
          context,
        });
      });
  }

  action<R>(fn: (ctx: AuthedCtx<void>) => Promise<R>) {
    return authed_client.action(async ({ ctx }) => {
      return fn({
        user: ctx.user,
        session: ctx.session,
        input: undefined,
      });
    });
  }
}

class PublicRoot {
  input<S extends z.ZodType>(schema: S): PublicValidated<S> {
    return new PublicValidated<S>(schema);
  }

  query<R>(fn: (ctx: PublicCtx<void>) => Promise<R>): Promise<Result<R>> {
    return runQuery(async () => {
      const session = await resolveSession();
      return fn({ user: null, session, input: undefined });
    });
  }

  route<R>(fn: (ctx: PublicRouteCtx<void>) => Promise<R>): RouteHandler<R> {
    return (request, context) =>
      runRoute(async () => {
        const session = await resolveSession();
        return fn({ user: null, session, input: undefined, request, context });
      });
  }

  action<R>(fn: (ctx: PublicCtx<void>) => Promise<R>) {
    return publicly_client.action(async () => {
      return fn({ user: null, session: null, input: undefined });
    });
  }
}

export const authed: AuthedRoot = new AuthedRoot();
export const publicly: PublicRoot = new PublicRoot();

export function isResultSuccessful<T>(
  result: Result<T>
): result is { data: T; error: null } {
  return result.error === null;
}
