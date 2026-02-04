/**
 * Centralized error handling utilities with Sentry integration
 *
 * This module provides standardized error handling patterns across the application,
 * ensuring all errors are properly logged, tracked in Sentry with event IDs,
 * and formatted consistently for API responses.
 *
 * @module error-handler
 */

import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { logger } from "../logger";

/**
 * Standard API error response structure with Sentry event ID
 */
export interface ApiErrorResponse {
  error: string;
  code: string;
  eventId?: string;
  details?: string; // Only included in development
}

/**
 * Captures an error to Sentry and logs it with the logger
 *
 * @param error - The error to capture
 * @param context - Additional context for the error (tags, extra data)
 * @returns The Sentry event ID for reference
 *
 * @example
 * const eventId = captureAndLogError(error, {
 *   tags: { api_route: "/api/doorcards", method: "POST" },
 *   extra: { userId: user.id }
 * });
 */
export function captureAndLogError(
  error: unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
  }
): string {
  // Log error with logger
  logger.error(error instanceof Error ? error.message : String(error), error);

  // Capture to Sentry with context
  const eventId = Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level || "error",
  });

  return eventId;
}

/**
 * Formats an error into a standardized API response with Sentry event ID
 *
 * @param error - The error to format
 * @param statusCode - HTTP status code for the response
 * @param message - User-facing error message
 * @param code - Error code for programmatic handling
 * @param context - Additional context for Sentry
 * @returns NextResponse with formatted error
 *
 * @example
 * return formatApiError(
 *   error,
 *   500,
 *   "Failed to create doorcard",
 *   "CREATION_FAILED",
 *   { tags: { api_route: "/api/doorcards" } }
 * );
 */
export function formatApiError(
  error: unknown,
  statusCode: number,
  message: string,
  code: string,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): NextResponse<ApiErrorResponse> {
  // Capture error and get event ID
  const eventId = captureAndLogError(error, context);

  // Build response body
  const responseBody: ApiErrorResponse = {
    error: message,
    code,
    eventId,
  };

  // Include error details in development only
  if (process.env.NODE_ENV === "development") {
    responseBody.details =
      error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json(responseBody, { status: statusCode });
}

/**
 * Common error codes for consistent error handling across the API
 */
export const ErrorCodes = {
  // Generic errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",

  // Database errors
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  DB_CONNECTION_ERROR: "DB_CONNECTION_ERROR",
  CONNECTION_TIMEOUT: "CONNECTION_TIMEOUT",

  // Business logic errors
  CREATION_FAILED: "CREATION_FAILED",
  UPDATE_FAILED: "UPDATE_FAILED",
  DELETE_FAILED: "DELETE_FAILED",
  INVALID_OPERATION: "INVALID_OPERATION",

  // Resource-specific errors
  DOORCARD_NOT_FOUND: "DOORCARD_NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  APPOINTMENT_NOT_FOUND: "APPOINTMENT_NOT_FOUND",
} as const;

/**
 * Type guard to check if error is a known Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Extracts a meaningful message from an unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}
