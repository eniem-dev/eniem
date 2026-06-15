import { env } from "@/config";

/**
 * Application logger with environment-aware output
 * Provides structured logging methods with development/production modes
 * @example
 * ```typescript
 * logger.error("Database connection failed", { connectionString: "..." });
 * logger.warn("Deprecated API usage", { method: "oldMethod" });
 * logger.info("User logged in", { userId: "123" });
 * ```
 */
export const logger = {
  /**
   * Logs error messages with optional data context
   * @param message - Error message to log
   * @param data - Optional additional data to include
   */
  error: (message: string, data?: unknown) => {
    if (env.isDevelopment) {
      console.error(`[ERROR] ${message}`, data);
    } else {
      console.error(`[ERROR] ${message}`, data);
    }
  },
  /**
   * Logs warning messages with optional data context
   * Only outputs in development mode
   * @param message - Warning message to log
   * @param data - Optional additional data to include
   */
  warn: (message: string, data?: unknown) => {
    if (env.isDevelopment) {
      console.warn(`[WARN] ${message}`, data);
    }
  },
  /**
   * Logs informational messages with optional data context
   * Only outputs in development mode
   * @param message - Info message to log
   * @param data - Optional additional data to include
   */
  info: (message: string, data?: unknown) => {
    if (env.isDevelopment) {
      console.info(`[INFO] ${message}`, data);
    }
  },
  /**
   * Logs general messages with optional data context
   * Only outputs in development mode
   * @param message - Message to log
   * @param data - Optional additional data to include
   */
  log: (message: string, data?: unknown) => {
    if (env.isDevelopment) {
      console.log(`[LOG] ${message}`, data);
    }
  },
  debug: (message: string, data?: unknown) => {
    if (env.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  },
};
