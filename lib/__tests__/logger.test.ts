import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger, safeConsole } from "../logger";

// Mock console methods
const originalConsole = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

describe("Logger Security Tests", () => {
  beforeEach(() => {
    // Mock console methods for testing
    console.debug = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();

    // Reset environment
    vi.resetAllMocks();
  });

  afterEach(() => {
    // Restore original console methods
    Object.assign(console, originalConsole);
  });

  describe("Environment-based logging", () => {
    it("should log in development environment", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      logger.info("Test message");

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("[INFO] Test message"),
        undefined
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should log in test environment", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";

      logger.warn("Test warning");

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("[WARN] Test warning"),
        undefined
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should NOT log in production environment", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      // Need to create a new logger instance for production check
      const loggerModule = await import("../logger");
      const prodLogger = new (loggerModule.Logger as any)();

      prodLogger.info("This should not appear");

      expect(console.info).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Sensitive data sanitization", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development"; // Enable logging for these tests
    });

    it("should sanitize password fields", () => {
      logger.info("User login attempt", {
        email: "user@example.com",
        password: "super-secret-password",
      });

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("[INFO] User login attempt"),
        expect.objectContaining({
          email: "user@example.com",
          password: "supe...",
        })
      );
    });

    it("should sanitize token fields", () => {
      logger.debug("API request", {
        endpoint: "/api/doorcards",
        access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        refresh_token: "refresh-token-value",
      });

      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining("[DEBUG] API request"),
        expect.objectContaining({
          endpoint: "/api/doorcards",
          access_token: "eyJh...",
          refresh_token: "refr...",
        })
      );
    });

    it("should sanitize authorization headers", () => {
      logger.warn("Request failed", {
        status: 401,
        authorization: "Bearer secret-token",
        cookie: "session=abc123; auth=xyz789",
      });

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("[WARN] Request failed"),
        expect.objectContaining({
          status: 401,
          authorization: "Bear...",
          cookie: "sess...",
        })
      );
    });

    it("should sanitize various sensitive key patterns", () => {
      logger.error("Security event", {
        userPassword: "password123",
        apiKey: "sk-1234567890",
        secretKey: "secret-value",
        sessionToken: "session-abc123",
        id_token: "jwt.token.here",
      });

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR] Security event"),
        expect.objectContaining({
          userPassword: "pass...",
          apiKey: "sk-1...",
          secretKey: "secr...",
          sessionToken: "sess...",
          id_token: "jwt....",
        })
      );
    });

    it("should handle empty or null sensitive values", () => {
      logger.info("Empty values test", {
        password: "",
        token: null,
        secret: undefined,
      });

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("[INFO] Empty values test"),
        expect.objectContaining({
          password: "[REDACTED]",
          token: "[REDACTED]",
          secret: "[REDACTED]",
        })
      );
    });

    it("should preserve non-sensitive data", () => {
      logger.info("Safe data", {
        userId: "user-123",
        email: "user@example.com",
        name: "John Doe",
        timestamp: "2024-01-01T00:00:00Z",
      });

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("[INFO] Safe data"),
        expect.objectContaining({
          userId: "user-123",
          email: "user@example.com",
          name: "John Doe",
          timestamp: "2024-01-01T00:00:00Z",
        })
      );
    });
  });

  describe("Error handling and context normalization", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("should handle Error objects correctly", () => {
      const testError = new Error("Database connection failed");
      testError.stack = "Error: Database connection failed\n    at test.js:1:1";

      logger.error("Database error", testError);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR] Database error"),
        expect.objectContaining({
          message: "Database connection failed",
          name: "Error",
          stack: expect.stringContaining("Error: Database connection failed"),
        })
      );
    });

    it("should handle primitive values as context", () => {
      logger.info("String context", "simple string");
      logger.warn("Number context", 42);
      logger.debug("Boolean context", true);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("[INFO] String context"),
        { value: "simple string" }
      );

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("[WARN] Number context"),
        { value: 42 }
      );

      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining("[DEBUG] Boolean context"),
        { value: true }
      );
    });

    it("should handle null and undefined context", () => {
      logger.info("Null context", null);
      logger.info("Undefined context", undefined);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("[INFO] Null context"),
        undefined
      );

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("[INFO] Undefined context"),
        undefined
      );
    });

    it("should handle arrays and complex objects", () => {
      logger.debug("Array context", ["item1", "item2"]);
      logger.debug("Object context", { nested: { data: "value" } });

      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining("[DEBUG] Array context"),
        { value: ["item1", "item2"] }
      );

      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining("[DEBUG] Object context"),
        { nested: { data: "value" } }
      );
    });
  });

  describe("Production error logging", () => {
    it("should log errors in production without sensitive data", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const testError = new Error("Critical system error");
      testError.stack =
        "Error: Critical system error\n    at production.js:1:1";

      logger.errorProduction("Production error occurred", testError);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR] Production error occurred"),
        expect.objectContaining({
          message: "Critical system error",
          stack: undefined, // Should not include stack in production
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should include stack trace in development for errorProduction", () => {
      process.env.NODE_ENV = "development";

      const testError = new Error("Development error");
      testError.stack = "Error: Development error\n    at dev.js:1:1";

      logger.errorProduction("Development error occurred", testError);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR] Development error occurred"),
        expect.objectContaining({
          message: "Development error",
          stack: expect.stringContaining("Error: Development error"),
        })
      );
    });
  });

  describe("Log levels and timestamps", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("should include proper log levels in messages", () => {
      logger.debug("Debug message");
      logger.info("Info message");
      logger.warn("Warn message");
      logger.error("Error message");

      expect(console.debug).toHaveBeenCalledWith(
        expect.stringMatching(/\[DEBUG\] Debug message/),
        undefined
      );

      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\] Info message/),
        undefined
      );

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching(/\[WARN\] Warn message/),
        undefined
      );

      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/\[ERROR\] Error message/),
        undefined
      );
    });

    it("should include ISO timestamps in log messages", () => {
      logger.info("Timestamp test");

      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/
        ),
        undefined
      );
    });
  });

  describe("safeConsole legacy methods", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("should provide safe console methods that delegate to logger", () => {
      safeConsole.log("Log message");
      safeConsole.debug("Debug message");
      safeConsole.info("Info message");
      safeConsole.warn("Warn message");
      safeConsole.error("Error message");

      // All log and debug calls should go to logger.debug
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining("Log message"),
        { value: undefined }
      );

      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining("Debug message"),
        { value: undefined }
      );

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("Info message"),
        { value: undefined }
      );

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Warn message"),
        { value: undefined }
      );

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Error message"),
        { value: undefined }
      );
    });

    it("should provide errorProduction method", () => {
      const testError = new Error("Production error");
      safeConsole.errorProduction("Safe error", testError);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Safe error"),
        expect.objectContaining({
          message: "Production error",
        })
      );
    });
  });
});
