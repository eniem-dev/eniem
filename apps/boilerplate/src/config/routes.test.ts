import { describe, it, expect } from "vitest";
import { routes } from "./routes";

describe("routes", () => {
  it("has boards routes", () => {
    expect(routes.boards.list).toBe("/boards");
    expect(routes.boards.new).toBe("/boards/new");
    expect(routes.boards.manage("abc")).toBe("/boards/abc");
  });

  it("has publicBoard route", () => {
    expect(routes.publicBoard("my-board")).toBe("/b/my-board");
  });
});
