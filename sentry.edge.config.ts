// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Use VERCEL_ENV for more reliable environment detection
const isProduction = process.env.VERCEL_ENV === "production";

// Only enable Sentry in production to preserve quota
const shouldEnableSentry = isProduction && !!process.env.SENTRY_DSN;

Sentry.init({
  // Disable Sentry entirely in non-production environments
  dsn: shouldEnableSentry ? process.env.SENTRY_DSN : undefined,
  enabled: shouldEnableSentry,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,

  // AGGRESSIVE sampling to preserve free tier quota
  tracesSampleRate: shouldEnableSentry ? 0.01 : 0,
  profilesSampleRate: shouldEnableSentry ? 0.001 : 0,

  // Disable logs to reduce noise
  enableLogs: false,

  // Never enable debug mode
  debug: false,

  // Comprehensive error filtering
  beforeSend(event) {
    if (!shouldEnableSentry) {
      return null;
    }

    const errorMessage = event.exception?.values?.[0]?.value || "";

    // Filter out common non-actionable edge errors
    const ignoredErrors = [
      "ChunkLoadError",
      "ECONNRESET",
      "ETIMEDOUT",
      "Network request failed",
      "Failed to fetch",
      // Middleware redirects (expected behavior)
      "NEXT_REDIRECT",
      "Invariant: headers() expects",
    ];

    if (ignoredErrors.some((ignored) => errorMessage.includes(ignored))) {
      return null;
    }

    // Scrub sensitive data
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }

    return event;
  },

  // Filter transactions
  beforeSendTransaction(event) {
    if (!shouldEnableSentry) {
      return null;
    }

    // Only track middleware for important routes
    const url = event.transaction || "";
    if (url.includes("/_next/") || url.includes("/static/")) {
      return null;
    }

    return event;
  },
});
