import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { PrismaErrorHandler, withRetry } from "../prisma-error-handler";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      body,
      status: init?.status || 200,
    })),
  },
}));

const mockNextResponse = NextResponse as jest.Mocked<typeof NextResponse>;

describe("PrismaErrorHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handle", () => {
    it("should handle P2002 unique constraint violation", () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
        }
      );

      PrismaErrorHandler.handle(error);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: "A record with this value already exists",
          code: "DUPLICATE_ENTRY",
        },
        { status: 409 }
      );
    });

    it("should handle P2025 record not found", () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        "Record not found",
        {
          code: "P2025",
          clientVersion: "5.0.0",
        }
      );

      PrismaErrorHandler.handle(error);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: "Record not found",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    });

    it("should handle P2024 connection timeout", () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        "Connection timeout",
        {
          code: "P2024",
          clientVersion: "5.0.0",
        }
      );

      PrismaErrorHandler.handle(error);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: "Database connection timeout. Please try again.",
          code: "CONNECTION_TIMEOUT",
        },
        { status: 503 }
      );
    });

    it("should handle unknown PrismaClientKnownRequestError codes", () => {
      const error = new Prisma.PrismaClientKnownRequestError("Unknown error", {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        code: "P9999" as any,
        clientVersion: "5.0.0",
      });

      PrismaErrorHandler.handle(error);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: "An unexpected error occurred",
          code: "INTERNAL_ERROR",
        },
        { status: 500 }
      );
    });

    it("should handle PrismaClientInitializationError", () => {
      const error = new Prisma.PrismaClientInitializationError(
        "Failed to initialize client",
        "5.0.0"
      );

      PrismaErrorHandler.handle(error);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: "Database connection error. Please try again later.",
          code: "DB_CONNECTION_ERROR",
        },
        { status: 503 }
      );
    });

    it("should handle PrismaClientRustPanicError", () => {
      const error = new Prisma.PrismaClientRustPanicError(
        "Rust panic occurred",
        "5.0.0"
      );

      PrismaErrorHandler.handle(error);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          error: "An unexpected database error occurred",
          code: "DB_PANIC_ERROR",
        },
        { status: 500 }
      );
    });

    it("should handle generic errors and log in production", () => {
      const originalEnv = process.env.NODE_ENV;
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      try {
        process.env.NODE_ENV = "production";
        const error = new Error("Generic error");

        PrismaErrorHandler.handle(error);

        expect(consoleSpy).toHaveBeenCalledWith(
          "Unexpected database error:",
          error
        );
        expect(mockNextResponse.json).toHaveBeenCalledWith(
          {
            error: "An unexpected error occurred",
            code: "INTERNAL_ERROR",
          },
          { status: 500 }
        );
      } finally {
        process.env.NODE_ENV = originalEnv;
        consoleSpy.mockRestore();
      }
    });

    it("should handle generic errors without logging in development", () => {
      const originalEnv = process.env.NODE_ENV;
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      try {
        process.env.NODE_ENV = "development";
        const error = new Error("Generic error");

        PrismaErrorHandler.handle(error);

        expect(consoleSpy).not.toHaveBeenCalled();
        expect(mockNextResponse.json).toHaveBeenCalledWith(
          {
            error: "An unexpected error occurred",
            code: "INTERNAL_ERROR",
          },
          { status: 500 }
        );
      } finally {
        process.env.NODE_ENV = originalEnv;
        consoleSpy.mockRestore();
      }
    });
  });
});

describe("withRetry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return result on successful operation", async () => {
    const operation = jest.fn().mockResolvedValue("success");

    const result = await withRetry(operation);

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("should retry on P2024 error and eventually succeed", async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError("Timeout", {
          code: "P2024",
          clientVersion: "5.0.0",
        })
      )
      .mockResolvedValue("success");

    const result = await withRetry(operation, 3, 10); // Short delay for testing

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("should retry on P1001 error and eventually succeed", async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError("Connection error", {
          code: "P1001",
          clientVersion: "5.0.0",
        })
      )
      .mockResolvedValue("success");

    const result = await withRetry(operation, 3, 10);

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("should not retry on non-retryable errors", async () => {
    const operation = jest.fn().mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "5.0.0",
      })
    );

    await expect(withRetry(operation)).rejects.toThrow();
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("should not retry on generic errors", async () => {
    const operation = jest.fn().mockRejectedValue(new Error("Generic error"));

    await expect(withRetry(operation)).rejects.toThrow("Generic error");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("should throw after max retries exceeded", async () => {
    const operation = jest.fn().mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Timeout", {
        code: "P2024",
        clientVersion: "5.0.0",
      })
    );

    await expect(withRetry(operation, 2, 10)).rejects.toThrow();
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("should increase delay between retries", async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError("Timeout", {
          code: "P2024",
          clientVersion: "5.0.0",
        })
      )
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError("Timeout", {
          code: "P2024",
          clientVersion: "5.0.0",
        })
      )
      .mockResolvedValue("success");

    const startTime = Date.now();
    const result = await withRetry(operation, 3, 10);
    const endTime = Date.now();

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(3);
    // Should take at least 10ms (first delay) + 20ms (second delay) = 30ms
    expect(endTime - startTime).toBeGreaterThanOrEqual(25);
  });

  it("should use default retry parameters", async () => {
    const operation = jest.fn().mockResolvedValue("success");

    const result = await withRetry(operation);

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
