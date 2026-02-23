import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { listSpecs, moveSpec } from "../specs.js";
import * as fs from "fs/promises";

vi.mock("fs/promises");

describe("specs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("listSpecs", () => {
    it("returns only .md files from directory", async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        "feature-a.md",
        "feature-b.md",
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      const result = await listSpecs("/project/specs");

      expect(result).toEqual([
        { name: "feature-a", path: "/project/specs/feature-a.md" },
        { name: "feature-b", path: "/project/specs/feature-b.md" },
      ]);
    });

    it("excludes non-.md files", async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        "feature.md",
        "notes.txt",
        "README",
        "image.png",
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      const result = await listSpecs("/project/specs");

      expect(result).toEqual([
        { name: "feature", path: "/project/specs/feature.md" },
      ]);
    });

    it("returns empty array for empty directory", async () => {
      vi.mocked(fs.readdir).mockResolvedValue(
        [] as unknown as Awaited<ReturnType<typeof fs.readdir>>,
      );

      const result = await listSpecs("/project/specs");

      expect(result).toEqual([]);
    });

    it("returns empty array for non-existent directory", async () => {
      vi.mocked(fs.readdir).mockRejectedValue(
        new Error("ENOENT: no such file or directory"),
      );

      const result = await listSpecs("/project/specs/missing");

      expect(result).toEqual([]);
    });
  });

  describe("moveSpec", () => {
    it("creates target directory if it doesn't exist", async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.rename).mockResolvedValue(undefined);

      await moveSpec("/project/specs/feature.md", "/project/specs/planned");

      expect(fs.mkdir).toHaveBeenCalledWith("/project/specs/planned", {
        recursive: true,
      });
    });

    it("moves file to correct target path", async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.rename).mockResolvedValue(undefined);

      const result = await moveSpec(
        "/project/specs/feature.md",
        "/project/specs/planned",
      );

      expect(fs.rename).toHaveBeenCalledWith(
        "/project/specs/feature.md",
        "/project/specs/planned/feature.md",
      );
      expect(result).toBe("/project/specs/planned/feature.md");
    });
  });
});
