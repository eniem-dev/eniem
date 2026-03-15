import { describe, expect, it } from "vitest";
import { locales } from "./index";

describe("locales - board feature keys", () => {
  it("BoardsPage has metadata title", () => {
    expect(locales.BoardsPage.metadata.title).toBe("My Boards");
  });

  it("PublicBoardView has statusAll", () => {
    expect(locales.PublicBoardView.statusAll).toBe("All");
  });

  it("errors has slugTaken", () => {
    expect(locales.errors.slugTaken).toBe("This slug is already taken.");
  });

  it("toasts has boardCreated", () => {
    expect(locales.toasts.boardCreated).toBe("Board created");
  });

  it("IdeaAdmin has subscriptionRequired", () => {
    expect(locales.IdeaAdmin.subscriptionRequired).toBe(
      "Active subscription required to manage ideas."
    );
  });
});
