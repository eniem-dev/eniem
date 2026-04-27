import type { BetterAuthOptions } from "better-auth";

import { logger } from "@/lib/logger";

const logByLevel = {
  error: logger.error,
  warn: logger.warn,
  info: logger.info,
} as const;

export const loggerAdapter: BetterAuthOptions["logger"] = {
  level: "info",
  log: (level, message, ...args) => {
    const fn = logByLevel[level as keyof typeof logByLevel] ?? logger.log;
    fn(message, { metadata: args });
  },
};
