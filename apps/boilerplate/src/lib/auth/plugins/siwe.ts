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
  // The plugin's `cacao.p` is the canonical source for the expected domain and
  // nonce — if a future better-auth upgrade changes its shape, this adapter
  // must be re-checked.
  verifyMessage: async ({ message, signature, address, chainId, cacao }) => {
    const expectedDomain = cacao?.p.domain ?? APP_DOMAIN;
    const expectedNonce = cacao?.p.nonce;
    if (!expectedNonce) {
      logger.error("SIWE verification failed: missing nonce in cacao", {
        address,
      });
      return false;
    }

    const result = await verifySiweMessage({
      message,
      signature,
      expectedDomain,
      expectedNonce,
      expectedAddress: address,
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
  },
});
