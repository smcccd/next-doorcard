// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Use VERCEL_ENV for more reliable environment detection
// VERCEL_ENV: "production" | "preview" | "development"
// Only enable Sentry in actual production to preserve free tier quota
const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";
const isPreview = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";
const isDevelopment = !isProduction && !isPreview;

// Only initialize Sentry in production to preserve quota
// Preview and development environments should NOT send errors to Sentry
const shouldEnableSentry = isProduction && !!process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  // Disable Sentry entirely in non-production environments
  dsn: shouldEnableSentry ? process.env.NEXT_PUBLIC_SENTRY_DSN : undefined,
  enabled: shouldEnableSentry,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,

  // Add optional integrations for additional features
  integrations: shouldEnableSentry
    ? [
        Sentry.replayIntegration({
          // Mask sensitive text content
          maskAllText: true,
          blockAllMedia: true,
        }),
        // Add user feedback integration (available in free tier)
        Sentry.feedbackIntegration({
          colorScheme: "light",
          showBranding: false,
          autoInject: false,
        }),
      ]
    : [],

  // AGGRESSIVE sampling to preserve free tier quota (5K errors/month)
  // Only sample 1% of transactions and profiles
  tracesSampleRate: shouldEnableSentry ? 0.01 : 0,
  profilesSampleRate: shouldEnableSentry ? 0.001 : 0,

  // Disable logs in production to reduce noise
  enableLogs: false,

  // MINIMAL replay sampling to preserve quota
  // 0.1% of sessions, 1% of error sessions
  replaysSessionSampleRate: shouldEnableSentry ? 0.001 : 0,
  replaysOnErrorSampleRate: shouldEnableSentry ? 0.01 : 0,

  // Never enable debug mode
  debug: false,

  // Comprehensive error filtering to reduce noise
  beforeSend(event, hint) {
    // Don't send any events in non-production
    if (!shouldEnableSentry) {
      return null;
    }

    const errorMessage = event.exception?.values?.[0]?.value || "";
    const errorType = event.exception?.values?.[0]?.type || "";

    // Filter out common non-actionable errors
    const ignoredErrors = [
      "ChunkLoadError",
      "NetworkError",
      "Load failed",
      "Failed to fetch",
      "Network request failed",
      "AbortError",
      "TimeoutError",
      "ResizeObserver loop",
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Non-Error promise rejection",
      "Non-Error exception captured",
      "cancelled",
      "Cancelled",
      "CANCELLED",
      "Script error",
      "script error",
      // Browser extension errors
      "chrome-extension://",
      "moz-extension://",
      "safari-extension://",
      // Third-party script errors
      "gtag",
      "clarity",
      "analytics",
    ];

    if (
      ignoredErrors.some(
        (ignored) =>
          errorMessage.includes(ignored) || errorType.includes(ignored)
      )
    ) {
      return null;
    }

    // Filter out hydration errors (common in Next.js, usually not actionable)
    if (
      errorMessage.includes("Hydration") ||
      errorMessage.includes("hydrat") ||
      errorMessage.includes("Text content does not match")
    ) {
      return null;
    }

    // Filter out errors from browser extensions
    if (event.request?.url?.includes("extension://")) {
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

    // Drop transaction if it's not an important route
    if (!importantRoutes.some((route) => url.includes(route))) {
      return null;
    }

    return event;
  },
});

export const onRouterTransitionStart = shouldEnableSentry
  ? Sentry.captureRouterTransitionStart
  : () => {};
