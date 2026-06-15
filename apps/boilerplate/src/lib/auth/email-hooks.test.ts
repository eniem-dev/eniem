import { describe, it, expect, beforeEach, vi } from "vitest";

import { ServerError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  resendSend: vi.fn(),
  loggerError: vi.fn(),
  loggerInfo: vi.fn(),
}));

vi.mock("@/config", () => ({
  env: {
    isDevelopment: false,
    email: {
      resendApiKey: "test_key",
      fromAddress: "test@example.com",
      brandLogoUrl: "https://example.com/logo.png",
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: mocks.loggerError,
    info: mocks.loggerInfo,
    warn: vi.fn(),
    log: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/lib/email/resend-client", () => ({
  getResend: () => ({
    emails: { send: mocks.resendSend },
  }),
}));

describe("auth email hooks", () => {
  beforeEach(() => {
    mocks.resendSend.mockReset();
    mocks.loggerError.mockClear();
    mocks.loggerInfo.mockClear();
  });

  it("throws a server error and logs safe metadata when a verification email fails", async () => {
    mocks.resendSend.mockResolvedValue({
      error: { message: "Resend unavailable" },
    });
    const { sendVerificationEmail } = await import("./email-hooks");

    const result = sendVerificationEmail({
      user: { id: "user_1", email: "user@example.com" },
      url: "https://example.com/verify?token=secret-token",
      token: "secret-token",
    });

    await expect(result).rejects.toMatchObject({
      name: "ServerError",
      message: "Failed to send verification email",
      statusCode: 500,
    });
    await expect(result).rejects.toBeInstanceOf(ServerError);
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "auth.email.delivery_failed",
      {
        type: "verification",
        to: "user@example.com",
        error: { code: "send_failed", message: "Resend unavailable" },
      },
    );
    expect(JSON.stringify(mocks.loggerError.mock.calls)).not.toContain(
      "secret-token",
    );
    expect(JSON.stringify(mocks.loggerError.mock.calls)).not.toContain(
      "https://example.com/verify",
    );
  });

  it("throws a server error and logs safe metadata when an OTP email fails", async () => {
    mocks.resendSend.mockResolvedValue({
      error: { message: "Resend rejected the request" },
    });
    const { sendOtp } = await import("./email-hooks");

    const result = sendOtp({
      email: "otp@example.com",
      otp: "654321",
    });

    await expect(result).rejects.toMatchObject({
      name: "ServerError",
      message: "Failed to send otp email",
      statusCode: 500,
    });
    await expect(result).rejects.toBeInstanceOf(ServerError);
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "auth.email.delivery_failed",
      {
        type: "otp",
        to: "otp@example.com",
        error: { code: "send_failed", message: "Resend rejected the request" },
      },
    );
    expect(JSON.stringify(mocks.loggerError.mock.calls)).not.toContain(
      "654321",
    );
  });
});
