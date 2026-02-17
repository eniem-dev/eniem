import { env } from "@/config";
import { Polar } from "@polar-sh/sdk";

if (!env.payment.polarAccessToken) {
  throw new Error("POLAR_ACCESS_TOKEN is required");
}

export const polarClient = new Polar({
  accessToken: env.payment.polarAccessToken,
  server: env.payment.polarServer as "sandbox" | "production",
});
