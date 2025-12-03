// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Use VERCEL_ENV for more reliable environment detection
// VERCEL_ENV: "production" | "preview" | "development"
const isProduction = process.env.VERCEL_ENV === "production";

// Only enable Sentry in production to preserve quota
const shouldEnableSentry = isProduction && !!process.env.SENTRY_DSN;

Sentry.init({
  // Disable Sentry entirely in non-production environments
  dsn: shouldEnableSentry ? process.env.SENTRY_DSN : undefined,
  enabled: shouldEnableSentry,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,

  // AGGRESSIVE sampling to preserve free tier quota (5K errors/month)
  tracesSampleRate: shouldEnableSentry ? 0.01 : 0,
  profilesSampleRate: shouldEnableSentry ? 0.001 : 0,

  // Disable logs to reduce noise
  enableLogs: false,

  // Never enable debug mode in any environment
  debug: false,

  // Comprehensive error filtering
  beforeSend(event) {
    if (!shouldEnableSentry) {
      return null;
    }

    const errorMessage = event.exception?.values?.[0]?.value || "";

    // Filter out common non-actionable server errors
    const ignoredErrors = [
      "ChunkLoadError",
      "ECONNRESET",
      "ECONNREFUSED",
      "ETIMEDOUT",
      "socket hang up",
      "Client network socket disconnected",
      "write EPIPE",
      "read ECONNRESET",
      // Prisma connection pool errors (transient)
      "Timed out fetching a new connection from the connection pool",
      "Can't reach database server",
      // Next.js internal errors
      "NEXT_NOT_FOUND",
      "NEXT_REDIRECT",
      // Rate limiting (expected behavior)
      "Rate limit exceeded",
    ];

    if (ignoredErrors.some((ignored) => errorMessage.includes(ignored))) {
      return null;
    }

    // Scrub sensitive data for compliance
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }

    return event;
  },

  // Filter transactions to reduce quota usage
  beforeSendTransaction(event) {
    if (!shouldEnableSentry) {
      return null;
    }

    // Only track important API routes
    const url = event.transaction || "";
    const importantRoutes = ["/api/doorcards", "/api/auth", "/api/admin"];

    if (!importantRoutes.some((route) => url.includes(route))) {
      return null;
    }

    return event;
  },
});
