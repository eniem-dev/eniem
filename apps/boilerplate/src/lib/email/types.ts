export type EmailMessage =
  | { type: "otp"; to: string; data: { otp: string } }
  | { type: "verification"; to: string; data: { url: string; token: string } }
  | { type: "password-reset"; to: string; data: { url: string; token: string } }
  | { type: "delete-account"; to: string; data: { url: string; token: string } };

export type EmailResult =
  | { success: true }
  | { success: false; error: { code: "send_failed"; message: string } };
