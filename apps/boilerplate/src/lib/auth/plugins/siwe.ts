import { siwe } from "better-auth/plugins";
import { generateSiweNonce } from "viem/siwe";

import { env } from "@/config";
import { logger } from "@/lib/logger";

import { verifySiweMessage } from "../side-effects";

const APP_DOMAIN = new URL(env.projectUrl).hostname;

export const siwePlugin = siwe({
  domain: APP_DOMAIN,
  emailDomainName: APP_DOMAIN,
  anonymous: true,
  getNonce: async () => generateSiweNonce(),
  // Expected domain is server-owned config; cacao only carries the server-stored nonce.
  verifyMessage: async ({ message, signature, address, chainId, cacao }) => {
    const expectedDomain = APP_DOMAIN;
    const expectedNonce = cacao?.p.nonce;
    if (expectedNonce === undefined) {
      logger.error("SIWE verification failed: missing nonce in cacao", {
        address,
      });
      return false;
    }

    try {
      const result = await verifySiweMessage({
        message,
        signature,
        expectedDomain,
        expectedNonce,
        expectedAddress: address,
        // The plugin keys nonces by address + request chainId, so chain-specific replay is blocked.
        expectedChainId: chainId,
        now: new Date(),
      });

      if (!result.success) {
        logger.error("SIWE verification failed", {
          reason: result.reason,
          address,
        });
        return false;
      }
      return true;
    } catch (error) {
      logger.error("SIWE verification crashed", { error, address });
      return false;
    }
  },
});
