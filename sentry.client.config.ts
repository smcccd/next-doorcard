// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration({
      // Mask sensitive text content
      maskAllText: process.env.NODE_ENV === "production",
      blockAllMedia: process.env.NODE_ENV === "production",
    }),
  ],

  // Environment-based sampling rates to control costs and performance
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 1.0,

  // Enable logs only in development
  enableLogs: process.env.NODE_ENV !== "production",

  // Conservative replay sampling for production
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 0.1,
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Debug mode only in development
  debug: process.env.NODE_ENV === "development",

  // Filter out known noise and add error handling
  beforeSend(event) {
    // Filter out known client-side errors that aren't actionable
    if (event.exception?.values?.[0]?.value?.includes('ChunkLoadError')) {
      return null;
    }
    if (event.exception?.values?.[0]?.value?.includes('NetworkError')) {
      return null;
    }
    
    // Scrub sensitive data for compliance
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
