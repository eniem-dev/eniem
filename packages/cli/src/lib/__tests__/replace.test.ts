import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { replacePlaceholders } from "../replace.js";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

describe("replacePlaceholders", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "replace-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("replaces MyApp and myapp across multiple files", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src/index.ts"), 'const app = "myapp";\nexport const name = "MyApp";');
    await writeFile(join(tempDir, "README.md"), "# MyApp\n\nWelcome to myapp.");

    const result = await replacePlaceholders({
      destination: tempDir,
      slug: "acme",
      appName: "Acme Corp",
    });

    expect(result.success).toBe(true);
    expect(result.filesModified).toBe(2);
    expect(result.occurrences).toBe(4);

    const indexContent = await readFile(join(tempDir, "src/index.ts"), "utf-8");
    expect(indexContent).toBe('const app = "acme";\nexport const name = "Acme Corp";');

    const readmeContent = await readFile(join(tempDir, "README.md"), "utf-8");
    expect(readmeContent).toBe("# Acme Corp\n\nWelcome to acme.");
  });

  it("skips binary files with null bytes", async () => {
    await writeFile(join(tempDir, "text.txt"), "myapp");
    await writeFile(join(tempDir, "image.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x0d, 0x0a]));

    const result = await replacePlaceholders({
      destination: tempDir,
      slug: "acme",
      appName: "Acme",
    });

    expect(result.success).toBe(true);
    expect(result.filesModified).toBe(1);
  });

  it("skips node_modules directory", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await mkdir(join(tempDir, "node_modules/pkg"), { recursive: true });
    await writeFile(join(tempDir, "src/app.ts"), "myapp");
    await writeFile(join(tempDir, "node_modules/pkg/index.js"), "myapp should not change");

    const result = await replacePlaceholders({
      destination: tempDir,
      slug: "acme",
      appName: "Acme",
    });

    expect(result.success).toBe(true);
    expect(result.filesModified).toBe(1);

    const nodeContent = await readFile(join(tempDir, "node_modules/pkg/index.js"), "utf-8");
    expect(nodeContent).toBe("myapp should not change");
  });

  it("skips .git directory", async () => {
    await mkdir(join(tempDir, "src"), { recursive: true });
    await mkdir(join(tempDir, ".git"), { recursive: true });
    await writeFile(join(tempDir, "src/app.ts"), "myapp");
    await writeFile(join(tempDir, ".git/config"), "myapp should not change");

    const result = await replacePlaceholders({
      destination: tempDir,
      slug: "acme",
      appName: "Acme",
    });

    expect(result.success).toBe(true);
    expect(result.filesModified).toBe(1);
  });

  it("skips pnpm-lock.yaml", async () => {
    await writeFile(join(tempDir, "app.ts"), "myapp");
    await writeFile(join(tempDir, "pnpm-lock.yaml"), "myapp should not change");

    const result = await replacePlaceholders({
      destination: tempDir,
      slug: "acme",
      appName: "Acme",
    });

    expect(result.success).toBe(true);
    expect(result.filesModified).toBe(1);

    const lockContent = await readFile(join(tempDir, "pnpm-lock.yaml"), "utf-8");
    expect(lockContent).toBe("myapp should not change");
  });

  it("does not modify files with no matches", async () => {
    await writeFile(join(tempDir, "app.ts"), "myapp");
    await writeFile(join(tempDir, "utils.ts"), "no placeholders here");

    const result = await replacePlaceholders({
      destination: tempDir,
      slug: "acme",
      appName: "Acme",
    });

    expect(result.success).toBe(true);
    expect(result.filesModified).toBe(1);
  });

  it("returns success with 0 files for empty directory", async () => {
    const result = await replacePlaceholders({
      destination: tempDir,
      slug: "acme",
      appName: "Acme",
    });

    expect(result.success).toBe(true);
    expect(result.filesModified).toBe(0);
    expect(result.occurrences).toBe(0);
  });

  it("calls onProgress for each modified file", async () => {
    await writeFile(join(tempDir, "a.txt"), "myapp");
    await writeFile(join(tempDir, "b.txt"), "MyApp");

    const onProgress = vi.fn();
    await replacePlaceholders({
      destination: tempDir,
      slug: "acme",
      appName: "Acme",
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledTimes(2);
  });

  it("replaces MyApp before myapp to avoid double replacement", async () => {
    await writeFile(join(tempDir, "config.ts"), "MyApp is the display name, myapp is the slug");

    const result = await replacePlaceholders({
      destination: tempDir,
      slug: "cool-saas",
      appName: "Cool SaaS",
    });

    expect(result.success).toBe(true);

    const content = await readFile(join(tempDir, "config.ts"), "utf-8");
    expect(content).toBe("Cool SaaS is the display name, cool-saas is the slug");
  });

  it("returns error for non-existent destination", async () => {
    const result = await replacePlaceholders({
      destination: "/does-not-exist-" + Date.now(),
      slug: "acme",
      appName: "Acme",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
