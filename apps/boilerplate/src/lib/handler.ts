import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { createSafeActionClient } from "next-safe-action";

import { auth } from "./auth";
import { logger } from "./logger";
import { ServerError, UnauthorizedError, ValidationError } from "./errors";
import { locales } from "@/locales";

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type ServerResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export type AuthSession = NonNullable<typeof auth.$Infer.Session>;
export type Session = typeof auth.$Infer.Session | null;

export type Classified = {
  status: number;
  message: string;
  logLevel: "warn" | "error";
};

export function classifyError(error: unknown): Classified {
  if (error instanceof UnauthorizedError) {
    return { status: 401, message: error.message, logLevel: "error" };
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
    const message = error.issues[0]?.message ?? locales.errors.validationFailed;
    return { status: 400, message, logLevel: "warn" };
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

export async function resolveSession(): Promise<Session> {
  return auth.api.getSession({ headers: await headers() });
}

function logClassified(classified: Classified, error: unknown): void {
  const payload =
    error instanceof Error
      ? { message: error.message, stack: error.stack, status: classified.status }
      : { error, status: classified.status };
  if (classified.logLevel === "warn") {
    logger.warn(classified.message, payload);
  } else {
    logger.error(classified.message, payload);
  }
}

type AuthedCtx = { user: AuthSession["user"]; session: AuthSession };
type PublicCtx = { user: null; session: Session };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyZodSchema = z.ZodType<any, any, any>;

async function requireAuthedCtx(): Promise<AuthedCtx> {
  const session = await resolveSession();
  if (!session?.user) {
    throw new UnauthorizedError(locales.errors.unauthorized);
  }
  const authed = session as AuthSession;
  return { session: authed, user: authed.user };
}

async function buildPublicCtx(): Promise<PublicCtx> {
  const session = await resolveSession();
  return { session, user: null };
}

function parseInputRaw(schema: AnyZodSchema | null, raw: unknown): unknown {
  if (!schema) return undefined;
  return schema.parse(raw);
}

export const authed_client = createSafeActionClient({
  handleServerError: (error) => {
    const classified = classifyError(error);
    logClassified(classified, error);
    return classified.message;
  },
});

const authedWithSession = authed_client.use(async ({ next }) => {
  const { session, user } = await requireAuthedCtx();
  return next({ ctx: { session, user } });
});

const publicWithSession = authed_client.use(async ({ next }) => {
  const session = await resolveSession();
  return next({ ctx: { session } });
});

export interface AuthedHandler<I> {
  input<S extends AnyZodSchema>(schema: S): AuthedHandler<z.infer<S>>;
  query<R>(
    fn: (c: AuthedCtx & { input: I }) => Promise<R>
  ): () => Promise<ServerResponse<R>>;
  action<R>(
    fn: (c: AuthedCtx & { input: I }) => Promise<R>
  ): ReturnType<typeof buildAuthedAction<I, R>>;
  route<R>(
    fn: (c: AuthedCtx & { input: I; request: NextRequest }) => Promise<R>
  ): (req: NextRequest) => Promise<NextResponse<ApiResponse<R>>>;
}

export interface PublicHandler<I> {
  input<S extends AnyZodSchema>(schema: S): PublicHandler<z.infer<S>>;
  query<R>(
    fn: (c: PublicCtx & { input: I }) => Promise<R>
  ): () => Promise<ServerResponse<R>>;
  action<R>(
    fn: (c: PublicCtx & { input: I }) => Promise<R>
  ): ReturnType<typeof buildPublicAction<I, R>>;
  route<R>(
    fn: (c: PublicCtx & { input: I; request: NextRequest }) => Promise<R>
  ): (req: NextRequest) => Promise<NextResponse<ApiResponse<R>>>;
}

function buildAuthedAction<I, R>(
  schema: AnyZodSchema | null,
  fn: (c: AuthedCtx & { input: I }) => Promise<R>
) {
  if (schema) {
    return authedWithSession
      .inputSchema(schema)
      .action<R>(async ({ parsedInput, ctx }) =>
        fn({ session: ctx.session, user: ctx.user, input: parsedInput as I })
      );
  }
  return authedWithSession.action<R>(async ({ ctx }) =>
    fn({ session: ctx.session, user: ctx.user, input: undefined as I })
  );
}

function buildPublicAction<I, R>(
  schema: AnyZodSchema | null,
  fn: (c: PublicCtx & { input: I }) => Promise<R>
) {
  if (schema) {
    return publicWithSession
      .inputSchema(schema)
      .action<R>(async ({ parsedInput, ctx }) =>
        fn({ session: ctx.session, user: null, input: parsedInput as I })
      );
  }
  return publicWithSession.action<R>(async ({ ctx }) =>
    fn({ session: ctx.session, user: null, input: undefined as I })
  );
}

function runQuery<Ctx, I, R>(
  buildCtx: () => Promise<Ctx>,
  schema: AnyZodSchema | null,
  fn: (c: Ctx & { input: I }) => Promise<R>
): () => Promise<ServerResponse<R>> {
  return async () => {
    try {
      const ctx = await buildCtx();
      const input = parseInputRaw(schema, undefined) as I;
      const data = await fn({ ...ctx, input });
      return { data, error: null };
    } catch (error) {
      const classified = classifyError(error);
      logClassified(classified, error);
      return { data: null, error: classified.message };
    }
  };
}

function runRoute<Ctx, I, R>(
  buildCtx: () => Promise<Ctx>,
  schema: AnyZodSchema | null,
  fn: (c: Ctx & { input: I; request: NextRequest }) => Promise<R>
): (req: NextRequest) => Promise<NextResponse<ApiResponse<R>>> {
  return async (request: NextRequest) => {
    try {
      const ctx = await buildCtx();
      let rawInput: unknown = undefined;
      if (schema) {
        if (request.method === "GET") {
          rawInput = Object.fromEntries(request.nextUrl.searchParams);
        } else {
          rawInput = await request.json();
        }
      }
      const input = parseInputRaw(schema, rawInput) as I;
      const data = await fn({ ...ctx, input, request });
      return NextResponse.json({ success: true, data });
    } catch (error) {
      const classified = classifyError(error);
      logClassified(classified, error);
      return NextResponse.json<ApiResponse<R>>(
        { success: false, error: classified.message },
        { status: classified.status }
      );
    }
  };
}

function makeAuthedHandler<I>(schema: AnyZodSchema | null): AuthedHandler<I> {
  return {
    input<S extends AnyZodSchema>(next: S): AuthedHandler<z.infer<S>> {
      return makeAuthedHandler<z.infer<S>>(next);
    },
    query: (fn) => runQuery(requireAuthedCtx, schema, fn),
    action: (fn) => buildAuthedAction(schema, fn),
    route: (fn) => runRoute(requireAuthedCtx, schema, fn),
  };
}

function makePublicHandler<I>(schema: AnyZodSchema | null): PublicHandler<I> {
  return {
    input<S extends AnyZodSchema>(next: S): PublicHandler<z.infer<S>> {
      return makePublicHandler<z.infer<S>>(next);
    },
    query: (fn) => runQuery(buildPublicCtx, schema, fn),
    action: (fn) => buildPublicAction(schema, fn),
    route: (fn) => runRoute(buildPublicCtx, schema, fn),
  };
}

export const authed: AuthedHandler<undefined> = makeAuthedHandler(null);
export const publicly: PublicHandler<undefined> = makePublicHandler(null);
