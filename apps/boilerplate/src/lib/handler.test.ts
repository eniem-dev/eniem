import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("./auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("./logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), log: vi.fn() },
}));

import { auth } from "./auth";
import {
  authed,
  classifyError,
  publicly,
  resolveSession,
} from "./handler";
import { ServerError, UnauthorizedError, ValidationError } from "./errors";

const getSessionMock = vi.mocked(auth.api.getSession);

function fakeAuthSession() {
  return {
    session: { id: "s1", userId: "u1" },
    user: { id: "u1", email: "u@example.com", name: "U" },
  } as unknown as NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("classifyError", () => {
  it("maps UnauthorizedError to 401 error-level", () => {
    const c = classifyError(new UnauthorizedError("no auth"));
    expect(c).toEqual({ status: 401, message: "no auth", logLevel: "error" });
  });

  it("maps ValidationError to 400 warn-level", () => {
    const c = classifyError(new ValidationError("bad"));
    expect(c).toEqual({ status: 400, message: "bad", logLevel: "warn" });
  });

  it("maps ServerError to its own statusCode", () => {
    const c = classifyError(new ServerError("nope", 404));
    expect(c).toEqual({ status: 404, message: "nope", logLevel: "error" });
  });

  it("maps ZodError to 400 warn-level using first issue message", () => {
    const schema = z.object({ email: z.string().email("Invalid email") });
    const result = schema.safeParse({ email: "nope" });
    expect(result.success).toBe(false);
    if (result.success) return;
    const c = classifyError(result.error);
    expect(c.status).toBe(400);
    expect(c.logLevel).toBe("warn");
    expect(c.message).toBe("Invalid email");
  });

  it("maps generic Error to 500 error-level", () => {
    const c = classifyError(new Error("boom"));
    expect(c).toEqual({ status: 500, message: "boom", logLevel: "error" });
  });

  it("maps unknown values to 500 with fallback message", () => {
    const c = classifyError("oops");
    expect(c.status).toBe(500);
    expect(c.logLevel).toBe("error");
    expect(c.message).toBeTypeOf("string");
  });
});

describe("resolveSession", () => {
  it("returns null when better-auth yields no session", async () => {
    getSessionMock.mockResolvedValueOnce(null);
    await expect(resolveSession()).resolves.toBeNull();
  });

  it("returns the session object when one exists", async () => {
    const session = fakeAuthSession();
    getSessionMock.mockResolvedValueOnce(session);
    await expect(resolveSession()).resolves.toBe(session);
  });
});

describe("authed.query", () => {
  it("returns 401-shaped error when session is missing", async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const handler = authed.query(async () => ({ ok: true }));
    const result = await handler();
    expect(result.data).toBeNull();
    expect(typeof result.error).toBe("string");
    expect(result.error?.length).toBeGreaterThan(0);
  });

  it("invokes the handler with a non-null user when session exists", async () => {
    const session = fakeAuthSession();
    getSessionMock.mockResolvedValueOnce(session);
    const handler = authed.query(async ({ user }) => ({ userId: user.id }));
    const result = await handler();
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ userId: "u1" });
  });
});

describe("authed.route input parsing", () => {
  it("returns 400 + validation message when Zod parsing fails", async () => {
    const session = fakeAuthSession();
    getSessionMock.mockResolvedValueOnce(session);
    const schema = z.object({ email: z.string().email("Invalid email") });

    const handler = authed.input(schema).route(async ({ input }) => input);

    const req = new Request("http://localhost/x", {
      method: "POST",
      body: JSON.stringify({ email: "not-an-email" }),
      headers: { "content-type": "application/json" },
    });
    const res = await handler(req as unknown as Parameters<typeof handler>[0]);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ success: false, error: "Invalid email" });
  });
});

describe("publicly.query", () => {
  it("exposes user: null and a nullable session when no session exists", async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const handler = publicly.query(async ({ user, session }) => ({
      user,
      sessionIsNull: session === null,
    }));
    const result = await handler();
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ user: null, sessionIsNull: true });
  });

  it("passes through the session when one exists but still exposes user: null", async () => {
    const session = fakeAuthSession();
    getSessionMock.mockResolvedValueOnce(session);
    const handler = publicly.query(async ({ user, session: s }) => ({
      user,
      hasSession: s !== null,
    }));
    const result = await handler();
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ user: null, hasSession: true });
  });
});
