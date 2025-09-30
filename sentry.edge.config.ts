// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Environment-based sampling rates to control costs and performance
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: process.env.NODE_ENV !== "production",

  // Debug mode only in development
  debug: process.env.NODE_ENV === "development",

  // Filter out known noise and add error handling
  beforeSend(event) {
    // Filter out known client-side errors that aren't actionable
    if (event.exception?.values?.[0]?.value?.includes('ChunkLoadError')) {
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
