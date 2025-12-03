import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type { ApiErrorResponse } from "./error-handler";

export class PrismaErrorHandler {
  static handle(error: unknown): NextResponse<ApiErrorResponse> {
    // Capture error with Sentry and get event ID
    const eventId = Sentry.captureException(error, {
      tags: { error_type: "database" },
    });

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique constraint violation
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            error: "A record with this value already exists",
            code: "DUPLICATE_ENTRY",
            eventId,
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
            eventId,
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
            eventId,
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
          eventId,
        },
        { status: 503 }
      );
    }

    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return NextResponse.json(
        {
          error: "An unexpected database error occurred",
          code: "DB_PANIC_ERROR",
          eventId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
        eventId,
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
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
