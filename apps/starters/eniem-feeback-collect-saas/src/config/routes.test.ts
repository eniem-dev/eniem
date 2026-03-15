import { describe, expect, it } from "vitest";

import { routes } from "./routes";

describe("routes", () => {
  it("boards.list resolves to /boards", () => {
    expect(routes.boards.list).toBe("/boards");
  });

  it("boards.new resolves to /boards/new", () => {
    expect(routes.boards.new).toBe("/boards/new");
  });

  it("boards.manage(id) resolves to /boards/{id}", () => {
    expect(routes.boards.manage("abc")).toBe("/boards/abc");
  });

  it("publicBoard(slug) resolves to /b/{slug}", () => {
    expect(routes.publicBoard("my-product")).toBe("/b/my-product");
  });
});
