import { describe, it, expect, vi, beforeEach } from "vitest";

const onUserDeletedMock = vi.fn();

vi.mock("./side-effects", () => ({
  onUserDeleted: (...args: unknown[]) => onUserDeletedMock(...args),
}));

vi.mock("./email-hooks", () => ({
  sendChangeEmailVerification: vi.fn(),
  sendDeleteAccountVerification: vi.fn(),
}));

const { userConfig } = await import("./user-hooks");

describe("userConfig.deleteUser.afterDelete", () => {
  beforeEach(() => {
    onUserDeletedMock.mockReset();
  });

  it("forwards user.id to sideEffects.onUserDeleted", async () => {
    await userConfig.deleteUser.afterDelete({ id: "user_123" });

    expect(onUserDeletedMock).toHaveBeenCalledTimes(1);
    expect(onUserDeletedMock).toHaveBeenCalledWith("user_123");
  });
});

describe("userConfig.changeEmail", () => {
  it("is enabled and wires the email-hook adapter", () => {
    expect(userConfig.changeEmail.enabled).toBe(true);
    expect(typeof userConfig.changeEmail.sendChangeEmailVerification).toBe(
      "function"
    );
  });
});
