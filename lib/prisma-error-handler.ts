import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export class PrismaErrorHandler {
  static handle(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique constraint violation
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            error: "A record with this value already exists",
            code: "DUPLICATE_ENTRY",
          },
          { status: 409 }
        );
      }

      // P2025: Record not found
      if (error.code === "P2025") {
        return NextResponse.json(
          {
            error: "Record not found",
            code: "NOT_FOUND",
          },
          { status: 404 }
        );
      }

      // P2024: Timed out fetching a new connection from the pool
      if (error.code === "P2024") {
        return NextResponse.json(
          {
            error: "Database connection timeout. Please try again.",
            code: "CONNECTION_TIMEOUT",
          },
          { status: 503 }
        );
      }
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        {
          error: "Database connection error. Please try again later.",
          code: "DB_CONNECTION_ERROR",
        },
        { status: 503 }
      );
    }

    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return NextResponse.json(
        {
          error: "An unexpected database error occurred",
          code: "DB_PANIC_ERROR",
        },
        { status: 500 }
      );
    }

    // Log unexpected errors in production
    if (process.env.NODE_ENV === "production") {
      console.error("Unexpected database error:", error);
    }

    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

// Retry utility for transient errors
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;

      // Only retry on specific errors
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2024" || error.code === "P1001")
      ) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
        continue;
      }

      throw error;
    }
  }

  throw new Error("Max retries exceeded");
}
