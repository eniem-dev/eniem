import { env } from "@/config";
import { Polar } from "@polar-sh/sdk";

export const polarClient = new Polar({
  accessToken: env.payment.polarAccessToken,
  server: env.payment.polarServer as "sandbox" | "production",
});
