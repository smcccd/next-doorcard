/**
 * Feature Flags System
 *
 * Centralized feature toggle management for environment-specific features
 * Allows enabling/disabling features without code changes
 */

import { env } from "./env-config";

export interface FeatureFlags {
  // UI Features
  showBetaBanner: boolean;
  showDebugInfo: boolean;

  // Security Features
  enableRateLimiting: boolean;
  enableAuthDebug: boolean;

  // Performance Features
  enableCaching: boolean;
  enableAnalytics: boolean;

  // Development Features
  enableMockData: boolean;
  enableDevTools: boolean;
}

/**
 * Get all feature flags based on current environment
 */
export function getFeatureFlags(): FeatureFlags {
  return {
    // UI Features
    showBetaBanner: env.NEXT_PUBLIC_SHOW_BETA_BANNER,
    showDebugInfo: env.isDevelopment,

    // Security Features
    enableRateLimiting: env.ENABLE_RATE_LIMITING,
    enableAuthDebug: env.ENABLE_AUTH_DEBUG,

    // Performance Features
    enableCaching: env.isProduction,
    enableAnalytics: env.isProduction || env.isPreview,

    // Development Features
    enableMockData:
      env.isDevelopment && process.env.ENABLE_MOCK_DATA === "true",
    enableDevTools: env.isDevelopment,
  };
}

/**
 * Feature flag hooks for components
 */
export const featureFlags = getFeatureFlags();

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return featureFlags[feature];
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  return {
    environment: env.environment,
    isDevelopment: env.isDevelopment,
    isProduction: env.isProduction,
    isPreview: env.isPreview,
    logLevel: env.LOG_LEVEL,
  };
}

/**
 * Helper to conditionally execute code based on environment
 */
export function withEnvironment<T>(config: {
  development?: () => T;
  preview?: () => T;
  production?: () => T;
  fallback?: () => T;
}): T | undefined {
  if (env.isDevelopment && config.development) {
    return config.development();
  }
  if (env.isPreview && config.preview) {
    return config.preview();
  }
  if (env.isProduction && config.production) {
    return config.production();
  }
  if (config.fallback) {
    return config.fallback();
  }
  return undefined;
}

/**
 * Helper to get environment-specific values
 */
export function getEnvironmentValue<T>(values: {
  development?: T;
  preview?: T;
  production?: T;
  fallback: T;
}): T {
  if (env.isDevelopment && values.development !== undefined) {
    return values.development;
  }
  if (env.isPreview && values.preview !== undefined) {
    return values.preview;
  }
  if (env.isProduction && values.production !== undefined) {
    return values.production;
  }
  return values.fallback;
}
