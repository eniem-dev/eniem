import { Resend } from "resend";
import { env } from "@/config";

let instance: Resend | null = null;

export const resend: Resend = new Proxy({} as Resend, {
  get(_target, prop, receiver) {
    if (!instance) {
      instance = new Resend(env.email.resendApiKey);
    }
    return Reflect.get(instance, prop, receiver);
  },
});
