import { Resend } from "resend";
import { env } from "@/config";

let instance: Resend | undefined;

export function getResend(): Resend {
  if (!instance) {
    instance = new Resend(env.email.resendApiKey);
  }
  return instance;
}
