import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing the module under test
vi.mock("@/config", () => ({
  env: {
    upload: { provider: "database", maxFileSizeMB: 1, maxFileSizeBytes: 1048576 },
    storage: {
      endpoint: "https://nyc3.digitaloceanspaces.com",
      region: "nyc3",
      bucket: "test-bucket",
      accessKeyId: "test-key",
      secretAccessKey: "test-secret",
      cdn: "https://cdn.example.com",
    },
    isProduction: false,
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    file: {
      create: vi.fn(),
    },
  },
}));

vi.mock("./logger", () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

const mockSend = vi.fn().mockResolvedValue({});
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = mockSend;
  },
  PutObjectCommand: class {
    constructor(public input: unknown) {}
  },
}));

function createMockFile(name = "test.png", type = "image/png", size = 1024): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe("uploadImage", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe("database provider", () => {
    it("stores base64 in DB and returns /api/files/{id}", async () => {
      const { env } = await import("@/config");
      (env as { upload: { provider: string } }).upload.provider = "database";

      const { prisma } = await import("@/lib/db");
      vi.mocked(prisma.file.create).mockResolvedValue({
        id: "file-abc123",
        base64Data: "",
        mimeType: "image/png",
        userId: "user-1",
        createdAt: new Date(),
      });

      const { uploadImage } = await import("./file-upload");
      const result = await uploadImage(createMockFile(), "user-1");

      expect(result).toBe("/api/files/file-abc123");
      expect(prisma.file.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          mimeType: "image/png",
          userId: "user-1",
          base64Data: expect.any(String),
        }),
      });
    });
  });

  describe("digitalocean provider", () => {
    it("uploads to S3 and returns CDN URL", async () => {
      const { env } = await import("@/config");
      (env as { upload: { provider: string } }).upload.provider = "digitalocean";

      const { uploadImage } = await import("./file-upload");
      const result = await uploadImage(createMockFile(), "user-1");

      expect(result).toMatch(/^https:\/\/cdn\.example\.com\/no-prod\/users\/user-1\//);
    });

    it("throws when storage config is missing", async () => {
      const { env } = await import("@/config");
      (env as { upload: { provider: string } }).upload.provider = "digitalocean";
      (env as { storage: { bucket: string | undefined } }).storage.bucket = undefined;

      const { uploadImage } = await import("./file-upload");
      await expect(uploadImage(createMockFile(), "user-1")).rejects.toThrow();
    });
  });

  describe("invalid provider", () => {
    it("throws error listing valid options", async () => {
      const { env } = await import("@/config");
      (env as { upload: { provider: string } }).upload.provider = "invalid";

      const { uploadImage } = await import("./file-upload");
      await expect(uploadImage(createMockFile(), "user-1")).rejects.toThrow(
        /Invalid FILE_UPLOAD_PROVIDER.*"invalid".*"database".*"digitalocean"/
      );
    });
  });
});
