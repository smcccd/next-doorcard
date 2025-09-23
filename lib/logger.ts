/**
 * Secure logging utility that prevents sensitive data exposure in production
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: any;
}

// Helper type to allow common types that are often logged
type LoggableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Error
  | object
  | unknown;

/**
 * Safe logger that only logs in development and test environments
 * Automatically sanitizes sensitive data
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isTest = process.env.NODE_ENV === "test";
  private shouldLog = this.isDevelopment || this.isTest;

  /**
   * Sanitizes sensitive data from log context
   */
  private sanitize(data: LogContext): LogContext {
    const sanitized = { ...data };
    const sensitiveKeys = [
      "password",
      "token",
      "access_token",
      "refresh_token",
      "id_token",
      "authorization",
      "auth",
      "secret",
      "key",
      "cookie",
      "session",
    ];

    Object.keys(sanitized).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        if (typeof sanitized[key] === "string" && sanitized[key].length > 0) {
          // Show only first 4 chars for debugging
          sanitized[key] = `${sanitized[key].substring(0, 4)}...`;
        } else {
          sanitized[key] = "[REDACTED]";
        }
      }
    });

    return sanitized;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!this.shouldLog) return;

    const sanitizedContext = context ? this.sanitize(context) : undefined;
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case "debug":
        console.debug(logMessage, sanitizedContext);
        break;
      case "info":
        console.info(logMessage, sanitizedContext);
        break;
      case "warn":
        console.warn(logMessage, sanitizedContext);
        break;
      case "error":
        console.error(logMessage, sanitizedContext);
        break;
    }
  }

  debug(message: string, context?: LogContext | LoggableValue) {
    this.log("debug", message, this.normalizeContext(context));
  }

  info(message: string, context?: LogContext | LoggableValue) {
    this.log("info", message, this.normalizeContext(context));
  }

  warn(message: string, context?: LogContext | LoggableValue) {
    this.log("warn", message, this.normalizeContext(context));
  }

  error(message: string, context?: LogContext | LoggableValue) {
    this.log("error", message, this.normalizeContext(context));
  }

  /**
   * Normalize various input types to LogContext
   */
  private normalizeContext(
    context?: LogContext | LoggableValue
  ): LogContext | undefined {
    if (context === null || context === undefined) {
      return undefined;
    }

    if (context instanceof Error) {
      return {
        message: context.message,
        name: context.name,
        stack:
          process.env.NODE_ENV === "development" ? context.stack : undefined,
      };
    }

    if (typeof context === "object" && !Array.isArray(context)) {
      // Handle objects (including those with unknown types)
      try {
        return context as LogContext;
      } catch {
        return { value: String(context) };
      }
    }

    // For primitives (string, number, boolean) and unknown types, wrap in an object
    return { value: context };
  }

  /**
   * Production-safe error logging that doesn't expose sensitive data
   */
  errorProduction(message: string, error?: Error) {
    // Always log errors, even in production, but safely
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, {
      message: error?.message,
      stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
    });
  }
}

export const logger = new Logger();

/**
 * Legacy console methods that are safe for production
 * Use these instead of direct console.log calls
 */
export const safeConsole = {
  log: logger.debug.bind(logger),
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  errorProduction: logger.errorProduction.bind(logger),
};
