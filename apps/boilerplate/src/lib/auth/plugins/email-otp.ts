import { emailOTP } from "better-auth/plugins";

import { AUTH_CONSTANTS } from "@/lib/auth.constants";
import { sendOtp } from "../email-hooks";

export const emailOtpPlugin = emailOTP({
  sendVerificationOTP: sendOtp,
  otpLength: AUTH_CONSTANTS.OTP_LENGTH,
  expiresIn: AUTH_CONSTANTS.OTP_EXPIRES_IN_SECONDS,
  allowedAttempts: AUTH_CONSTANTS.OTP_MAX_ATTEMPTS,
});
