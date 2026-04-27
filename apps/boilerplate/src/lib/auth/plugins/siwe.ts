import { siwe } from "better-auth/plugins";
import { verifyMessage } from "viem";
import { generateSiweNonce } from "viem/siwe";

import { env } from "@/config";
import { logger } from "@/lib/logger";

export const siwePlugin = siwe({
  domain: new URL(env.projectUrl).hostname,
  emailDomainName: new URL(env.projectUrl).hostname,
  anonymous: true,
  getNonce: async () => generateSiweNonce(),
  verifyMessage: async ({ message, signature, address }) => {
    try {
      return await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });
    } catch (error) {
      logger.error("SIWE verification failed", { error, address });
      return false;
    }
  },
});
