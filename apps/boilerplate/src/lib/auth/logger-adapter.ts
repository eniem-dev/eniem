import type { BetterAuthOptions } from "better-auth";

import { logger } from "@/lib/logger";

export const loggerAdapter: BetterAuthOptions["logger"] = {
  level: "info",
  log: (level, message, ...args) => {
    switch (level) {
      case "error":
        logger.error(message, { metadata: args });
        break;
      case "warn":
        logger.warn(message, { metadata: args });
        break;
      case "info":
        logger.info(message, { metadata: args });
        break;
      default:
        logger.log(message, { metadata: args });
        break;
    }
  },
};
