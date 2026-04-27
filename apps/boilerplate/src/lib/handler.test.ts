import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { NextRequest } from "next/server";

const emptyContext = { params: Promise.resolve({}) };

vi.mock("./logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), log: vi.fn() },
}));

const getSessionMock = vi.fn();
vi.mock("./auth/config", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => getSessionMock(...args),
    },
  },
}));

describe("classifyError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps UnauthorizedError to 401 with warn", async () => {
    const { classifyError } = await import("./handler");
    const { UnauthorizedError } = await import("./errors");
    const r = classifyError(new UnauthorizedError("no session"));
    expect(r.status).toBe(401);
    expect(r.message).toBe("no session");
    expect(r.logLevel).toBe("warn");
  });

  it("maps ValidationError to 400 with warn", async () => {
    const { classifyError } = await import("./handler");
    const { ValidationError } = await import("./errors");
    const r = classifyError(new ValidationError("bad input"));
    expect(r.status).toBe(400);
    expect(r.logLevel).toBe("warn");
  });

  it("maps ServerError to its statusCode with error", async () => {
    const { classifyError } = await import("./handler");
    const { ServerError } = await import("./errors");
    const r = classifyError(new ServerError("boom", 503));
    expect(r.status).toBe(503);
    expect(r.logLevel).toBe("error");
  });

  it("maps ZodError to 400 with warn", async () => {
    const { classifyError } = await import("./handler");
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse({ email: "nope" });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const r = classifyError(parsed.error);
    expect(r.status).toBe(400);
    expect(r.logLevel).toBe("warn");
  });

  it("maps generic Error to 500 with error", async () => {
    const { classifyError } = await import("./handler");
    const r = classifyError(new Error("kaboom"));
    expect(r.status).toBe(500);
    expect(r.logLevel).toBe("error");
  });

  it("maps unknown non-Error values to 500 with error", async () => {
    const { classifyError } = await import("./handler");
    const r = classifyError("string thrown");
    expect(r.status).toBe(500);
    expect(r.logLevel).toBe("error");
  });
});

describe("authed.query", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockReset();
  });

  it("returns { data, error: null } when session exists", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "u1", email: "a@b.com" },
      session: { id: "s1" },
    });
    const { authed } = await import("./handler");
    const result = await authed.query(({ user }) =>
      Promise.resolve({ id: user.id })
    );
    expect(result).toEqual({ data: { id: "u1" }, error: null });
  });

  it("returns { data: null, error } 401 when session missing", async () => {
    getSessionMock.mockResolvedValue(null);
    const { authed } = await import("./handler");
    const result = await authed.query(() => Promise.resolve("never"));
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it("classifies ServerError thrown by the handler", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "u1" },
      session: { id: "s1" },
    });
    const { authed } = await import("./handler");
    const { ServerError } = await import("./errors");
    const result = await authed.query(() => {
      throw new ServerError("nope", 418);
    });
    expect(result.error).toBe("nope");
  });
});

describe("publicly.query", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockReset();
  });

  it("passes a null session through when no user is logged in", async () => {
    getSessionMock.mockResolvedValue(null);
    const { publicly } = await import("./handler");
    const result = await publicly.query(({ session, user }) =>
      Promise.resolve({ hasSession: session !== null, user })
    );
    expect(result).toEqual({
      data: { hasSession: false, user: null },
      error: null,
    });
  });
});

describe("authed.route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockReset();
  });

  it("returns NextResponse 200 with { success, data } on success", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "u1" },
      session: { id: "s1" },
    });
    const { authed } = await import("./handler");
    const handler = authed.route(({ user }) =>
      Promise.resolve({ id: user.id })
    );
    const res = await handler(new NextRequest("http://x/api"), emptyContext);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: { id: "u1" } });
  });

  it("returns 401 NextResponse when session is missing", async () => {
    getSessionMock.mockResolvedValue(null);
    const { authed } = await import("./handler");
    const handler = authed.route(() => Promise.resolve("never"));
    const res = await handler(new NextRequest("http://x/api"), emptyContext);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 on Zod input parsing failure", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "u1" },
      session: { id: "s1" },
    });
    const { authed } = await import("./handler");
    const schema = z.object({ name: z.string().min(3) });
    const handler = authed
      .input(schema)
      .route(({ input }) => Promise.resolve(input));
    const res = await handler(
      new NextRequest("http://x/api", {
        method: "POST",
        body: JSON.stringify({ name: "a" }),
        headers: { "content-type": "application/json" },
      }),
      emptyContext
    );
    expect(res.status).toBe(400);
  });
});

describe("authed.action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockReset();
  });

  it("returns data from the action body", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "u1" },
      session: { id: "s1" },
    });
    const { authed } = await import("./handler");
    const schema = z.object({ name: z.string() });
    const action = authed
      .input(schema)
      .action(({ input, user }) =>
        Promise.resolve({ greeting: `hi ${input.name}`, uid: user.id })
      );
    const res = await action({ name: "Ada" });
    expect(res?.data).toEqual({ greeting: "hi Ada", uid: "u1" });
  });

  it("propagates classified errors via serverError", async () => {
    getSessionMock.mockResolvedValue(null);
    const { authed } = await import("./handler");
    const schema = z.object({ name: z.string() });
    const action = authed
      .input(schema)
      .action(() => Promise.resolve("never"));
    const res = await action({ name: "Ada" });
    expect(res?.serverError).toBeTruthy();
  });
});
