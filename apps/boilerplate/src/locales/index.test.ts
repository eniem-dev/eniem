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

describe("locales - idea submission keys", () => {
  it("IdeaForm has all form labels", () => {
    expect(locales.IdeaForm.titleLabel).toBe("Title");
    expect(locales.IdeaForm.titlePlaceholder).toBe("What's your idea?");
    expect(locales.IdeaForm.descriptionLabel).toBe("Description");
    expect(locales.IdeaForm.submit).toBe("Submit Idea");
  });

  it("IdeaCard has edit and delete labels", () => {
    expect(locales.IdeaCard.edit).toBe("Edit");
    expect(locales.IdeaCard.delete).toBe("Delete");
  });

  it("errors has idea validation messages", () => {
    expect(locales.errors.ideaTitleRequired).toBe("Idea title is required.");
    expect(locales.errors.ideaTitleTooLong).toBe(
      "Idea title must be 200 characters or less."
    );
    expect(locales.errors.ideaDescriptionTooLong).toBe(
      "Description must be 2000 characters or less."
    );
    expect(locales.errors.ideaIdRequired).toBe("Idea ID is required.");
  });

  it("toasts has idea operation messages", () => {
    expect(locales.toasts.ideaSubmitted).toBe("Idea submitted");
    expect(locales.toasts.ideaUpdated).toBe("Idea updated");
    expect(locales.toasts.ideaDeleted).toBe("Idea deleted");
  });

  it("PublicBoardView has idea submission and empty state keys", () => {
    expect(locales.PublicBoardView.submitIdea).toBe("Submit Idea");
    expect(locales.PublicBoardView.signInToSubmit).toBe(
      "Sign in to submit an idea"
    );
    expect(locales.PublicBoardView.emptyBoard).toBe(
      "No ideas yet. Be the first to share your feedback!"
    );
  });

  it("IdeaAdmin has moderation labels", () => {
    expect(locales.IdeaAdmin.respond).toBe("Respond");
    expect(locales.IdeaAdmin.deleteConfirm).toContain("Delete this idea?");
  });
});
