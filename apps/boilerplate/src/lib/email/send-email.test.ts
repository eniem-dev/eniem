import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/config", () => ({
  env: {
    isDevelopment: true,
    email: {
      resendApiKey: "test_key",
      fromAddress: "test@example.com",
      brandLogoUrl: "https://example.com/logo.png",
    },
  },
}));

const loggerInfo = vi.fn();
vi.mock("../logger", () => ({
  logger: { info: loggerInfo, error: vi.fn(), warn: vi.fn(), log: vi.fn() },
}));

const resendSend = vi.fn();
vi.mock("./resend-client", () => ({
  getResend: () => ({
    emails: { send: (...args: unknown[]) => resendSend(...args) },
  }),
}));

describe("sendEmail (dev mode)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs otp variant with correct subject and debug metadata; does not call resend", async () => {
    const { sendEmail } = await import("./send-email");
    const result = await sendEmail({
      type: "otp",
      to: "a@b.com",
      data: { otp: "123456" },
    });

    expect(result).toEqual({ success: true });
    expect(resendSend).not.toHaveBeenCalled();
    expect(loggerInfo).toHaveBeenCalledWith(
      "email.dev",
      expect.objectContaining({
        to: "a@b.com",
        type: "otp",
        subject: "Your verification code",
        OTP: "123456",
      }),
    );
  });

  it("logs verification variant with correct subject and debug metadata", async () => {
    const { sendEmail } = await import("./send-email");
    const result = await sendEmail({
      type: "verification",
      to: "a@b.com",
      data: { url: "https://x.test/v", token: "tok" },
    });

    expect(result).toEqual({ success: true });
    expect(loggerInfo).toHaveBeenCalledWith(
      "email.dev",
      expect.objectContaining({
        to: "a@b.com",
        type: "verification",
        subject: "Verify your email",
        Token: "tok",
        "Verification Link": "https://x.test/v",
      }),
    );
  });

  it("logs password-reset variant with correct subject and debug metadata", async () => {
    const { sendEmail } = await import("./send-email");
    const result = await sendEmail({
      type: "password-reset",
      to: "a@b.com",
      data: { url: "https://x.test/r", token: "tok" },
    });

    expect(result).toEqual({ success: true });
    expect(loggerInfo).toHaveBeenCalledWith(
      "email.dev",
      expect.objectContaining({
        to: "a@b.com",
        type: "password-reset",
        subject: "Reset your password",
        Token: "tok",
        "Reset Link": "https://x.test/r",
      }),
    );
  });

  it("logs delete-account variant with correct subject and debug metadata", async () => {
    const { sendEmail } = await import("./send-email");
    const result = await sendEmail({
      type: "delete-account",
      to: "a@b.com",
      data: { url: "https://x.test/d", token: "tok" },
    });

    expect(result).toEqual({ success: true });
    expect(loggerInfo).toHaveBeenCalledWith(
      "email.dev",
      expect.objectContaining({
        to: "a@b.com",
        type: "delete-account",
        subject: "Confirm account deletion",
        Token: "tok",
        "Confirmation Link": "https://x.test/d",
      }),
    );
  });
});
