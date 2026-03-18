import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { listSpecs, moveSpec, sortByNumericPrefix } from "../specs.js";
import type { SpecFile } from "../specs.js";
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

    it("excludes README.md from results", async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        "feature.md",
        "README.md",
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      const result = await listSpecs("/project/specs");

      expect(result).toEqual([
        { name: "feature", path: "/project/specs/feature.md" },
      ]);
    });

    it("excludes readme.md case-insensitively", async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        "feature.md",
        "readme.md",
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      const result = await listSpecs("/project/specs");

      expect(result).toEqual([
        { name: "feature", path: "/project/specs/feature.md" },
      ]);
    });

    it("does not exclude files containing README in name", async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        "feature.md",
        "MY-README.md",
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      const result = await listSpecs("/project/specs");

      expect(result).toEqual([
        { name: "feature", path: "/project/specs/feature.md" },
        { name: "MY-README", path: "/project/specs/MY-README.md" },
      ]);
    });

    it("returns empty array when directory contains only README.md", async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        "README.md",
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

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

  describe("sortByNumericPrefix", () => {
    it("sorts numbered specs by numeric prefix ascending", () => {
      const specs: SpecFile[] = [
        { name: "03-billing", path: "/specs/03-billing.md" },
        { name: "01-infra", path: "/specs/01-infra.md" },
        { name: "02-board", path: "/specs/02-board.md" },
      ];

      const sorted = sortByNumericPrefix(specs);

      expect(sorted.map((s) => s.name)).toEqual([
        "01-infra",
        "02-board",
        "03-billing",
      ]);
    });

    it("places unnumbered specs after numbered ones", () => {
      const specs: SpecFile[] = [
        { name: "bar", path: "/specs/bar.md" },
        { name: "01-foo", path: "/specs/01-foo.md" },
        { name: "02-baz", path: "/specs/02-baz.md" },
      ];

      const sorted = sortByNumericPrefix(specs);

      expect(sorted.map((s) => s.name)).toEqual([
        "01-foo",
        "02-baz",
        "bar",
      ]);
    });

    it("sorts unnumbered specs alphabetically", () => {
      const specs: SpecFile[] = [
        { name: "zebra", path: "/specs/zebra.md" },
        { name: "alpha", path: "/specs/alpha.md" },
        { name: "middle", path: "/specs/middle.md" },
      ];

      const sorted = sortByNumericPrefix(specs);

      expect(sorted.map((s) => s.name)).toEqual([
        "alpha",
        "middle",
        "zebra",
      ]);
    });

    it("does not mutate original array", () => {
      const specs: SpecFile[] = [
        { name: "02-b", path: "/specs/02-b.md" },
        { name: "01-a", path: "/specs/01-a.md" },
      ];

      const sorted = sortByNumericPrefix(specs);

      expect(specs[0].name).toBe("02-b");
      expect(sorted[0].name).toBe("01-a");
    });

    it("handles empty array", () => {
      expect(sortByNumericPrefix([])).toEqual([]);
    });

    it("handles single spec", () => {
      const specs: SpecFile[] = [{ name: "only", path: "/specs/only.md" }];

      expect(sortByNumericPrefix(specs)).toEqual(specs);
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
