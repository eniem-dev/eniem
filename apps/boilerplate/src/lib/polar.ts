import { env } from "@/config";
import { Polar } from "@polar-sh/sdk";

let client: Polar | null = null;

function getClient(): Polar {
  if (!env.payment.polarAccessToken) {
    throw new Error("POLAR_ACCESS_TOKEN is required");
  }
  if (!client) {
    client = new Polar({
      accessToken: env.payment.polarAccessToken,
      server: env.payment.polarServer as "sandbox" | "production",
    });
  }
  return client;
}

export const polarClient = new Proxy({} as Polar, {
  get(_, prop) {
    return Reflect.get(getClient(), prop);
  },
});
