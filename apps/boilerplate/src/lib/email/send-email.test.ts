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
  resend: { emails: { send: (...args: unknown[]) => resendSend(...args) } },
}));

describe("renderMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders otp variant with correct subject and debugInfo", async () => {
    const { renderMessage } = await import("./send-email");
    const r = renderMessage({ type: "otp", to: "a@b.com", data: { otp: "123456" } });
    expect(r.subject).toBe("Your verification code");
    expect(r.debugInfo).toEqual({ OTP: "123456" });
  });

  it("renders verification variant with correct subject and debugInfo", async () => {
    const { renderMessage } = await import("./send-email");
    const r = renderMessage({
      type: "verification",
      to: "a@b.com",
      data: { url: "https://x.test/v", token: "tok" },
    });
    expect(r.subject).toBe("Verify your email");
    expect(r.debugInfo).toEqual({ Token: "tok", "Verification Link": "https://x.test/v" });
  });

  it("renders password-reset variant with correct subject and debugInfo", async () => {
    const { renderMessage } = await import("./send-email");
    const r = renderMessage({
      type: "password-reset",
      to: "a@b.com",
      data: { url: "https://x.test/r", token: "tok" },
    });
    expect(r.subject).toBe("Reset your password");
    expect(r.debugInfo).toEqual({ Token: "tok", "Reset Link": "https://x.test/r" });
  });

  it("renders delete-account variant with correct subject and debugInfo", async () => {
    const { renderMessage } = await import("./send-email");
    const r = renderMessage({
      type: "delete-account",
      to: "a@b.com",
      data: { url: "https://x.test/d", token: "tok" },
    });
    expect(r.subject).toBe("Confirm account deletion");
    expect(r.debugInfo).toEqual({ Token: "tok", "Confirmation Link": "https://x.test/d" });
  });
});

describe("sendEmail (dev mode)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs via logger.info with type, to, subject, and debugInfo; does not call resend", async () => {
    const { sendEmail } = await import("./send-email");
    const result = await sendEmail({ type: "otp", to: "a@b.com", data: { otp: "987654" } });

    expect(result).toEqual({ success: true });
    expect(resendSend).not.toHaveBeenCalled();
    expect(loggerInfo).toHaveBeenCalledWith(
      "email.dev",
      expect.objectContaining({
        to: "a@b.com",
        type: "otp",
        subject: "Your verification code",
        OTP: "987654",
      }),
    );
  });
});
