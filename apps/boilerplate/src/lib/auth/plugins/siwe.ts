import { siwe } from "better-auth/plugins";
import { isHex, verifyMessage } from "viem";
import { generateSiweNonce } from "viem/siwe";

import { env } from "@/config";
import { logger } from "@/lib/logger";

export const siwePlugin = siwe({
  domain: new URL(env.projectUrl).hostname,
  emailDomainName: new URL(env.projectUrl).hostname,
  anonymous: true,
  getNonce: async () => generateSiweNonce(),
  verifyMessage: async ({ message, signature, address }) => {
    if (!isHex(address) || !isHex(signature)) {
      logger.error("SIWE verification failed: invalid hex input", { address });
      return false;
    }
    try {
      return await verifyMessage({ address, message, signature });
    } catch (error) {
      logger.error("SIWE verification failed", { error, address });
      return false;
    }
  },
});
