import { describe, expect, it } from "vitest";

/**
 * We cannot import middleware.ts directly because it depends on next/server
 * and auth at module scope. Instead, we read the source and validate the
 * route configuration constants via regex extraction.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const src = readFileSync(resolve(__dirname, "middleware.ts"), "utf-8");

describe("middleware route configuration", () => {
  it('PUBLIC_ROUTE_PREFIXES contains "/b" for public board pages', () => {
    const match = src.match(
      /const PUBLIC_ROUTE_PREFIXES\s*=\s*\[([^\]]+)\]/
    );
    expect(match).not.toBeNull();
    const content = match![1];
    expect(content).toContain('"/b"');
  });

  it("PUBLIC_ROUTE_PREFIXES still contains routes.blog", () => {
    const match = src.match(
      /const PUBLIC_ROUTE_PREFIXES\s*=\s*\[([^\]]+)\]/
    );
    expect(match).not.toBeNull();
    const content = match![1];
    expect(content).toContain("routes.blog");
  });

  it("/boards is NOT in PUBLIC_ROUTES or PUBLIC_ROUTE_PREFIXES", () => {
    const publicRoutesMatch = src.match(
      /const PUBLIC_ROUTES\s*=\s*\[([\s\S]*?)\];/
    );
    expect(publicRoutesMatch).not.toBeNull();
    expect(publicRoutesMatch![1]).not.toContain("/boards");

    const prefixesMatch = src.match(
      /const PUBLIC_ROUTE_PREFIXES\s*=\s*\[([^\]]+)\]/
    );
    expect(prefixesMatch).not.toBeNull();
    expect(prefixesMatch![1]).not.toContain("/boards");
  });

  it("REQUIRE_ACCESS_ROUTES only contains routes.dashboard", () => {
    const match = src.match(
      /const REQUIRE_ACCESS_ROUTES[^=]*=\s*\[([^\]]*)\]/
    );
    expect(match).not.toBeNull();
    const content = match![1].trim();
    expect(content).toBe("routes.dashboard");
  });
});
