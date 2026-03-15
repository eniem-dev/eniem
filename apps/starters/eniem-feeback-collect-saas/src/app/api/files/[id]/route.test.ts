import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  prisma: {
    file: {
      findUnique: vi.fn(),
    },
  },
}));

import { GET } from "./route";
import { prisma } from "@/lib/db";

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/files/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns image binary with correct Content-Type", async () => {
    const base64 = Buffer.from("fake-image-data").toString("base64");
    vi.mocked(prisma.file.findUnique).mockResolvedValue({
      id: "file-1",
      base64Data: base64,
      mimeType: "image/png",
      userId: "user-1",
      createdAt: new Date(),
    });

    const response = await GET(
      new NextRequest("http://localhost/api/files/file-1"),
      makeContext("file-1")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");

    const body = await response.arrayBuffer();
    expect(Buffer.from(body).toString()).toBe("fake-image-data");
  });

  it("returns Cache-Control header for browser caching", async () => {
    const base64 = Buffer.from("data").toString("base64");
    vi.mocked(prisma.file.findUnique).mockResolvedValue({
      id: "file-1",
      base64Data: base64,
      mimeType: "image/jpeg",
      userId: "user-1",
      createdAt: new Date(),
    });

    const response = await GET(
      new NextRequest("http://localhost/api/files/file-1"),
      makeContext("file-1")
    );

    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable"
    );
  });

  it("returns 404 for non-existent file", async () => {
    vi.mocked(prisma.file.findUnique).mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost/api/files/missing"),
      makeContext("missing")
    );

    expect(response.status).toBe(404);
  });

  it("returns 500 on server error", async () => {
    vi.mocked(prisma.file.findUnique).mockRejectedValue(
      new Error("DB connection failed")
    );

    const response = await GET(
      new NextRequest("http://localhost/api/files/file-1"),
      makeContext("file-1")
    );

    expect(response.status).toBe(500);
  });
});
