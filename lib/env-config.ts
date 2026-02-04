/**
 * Environment Configuration & Validation
 *
 * Central module for accessing and validating environment variables
 * Provides type-safe access and fails fast with clear error messages
 */

export type Environment = "development" | "preview" | "production" | "test";
export type LogLevel = "debug" | "info" | "warn" | "error";

interface EnvConfig {
  // Environment detection
  NODE_ENV: string;
  VERCEL_ENV?: string;
  environment: Environment;
  isDevelopment: boolean;
  isProduction: boolean;
  isPreview: boolean;
  isTest: boolean;

  // Database
  DATABASE_URL: string;

  // NextAuth
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_DEBUG?: boolean;

  // OneLogin OAuth
  ONELOGIN_CLIENT_ID: string;
  ONELOGIN_CLIENT_SECRET: string;
  ONELOGIN_ISSUER: string;

  // Sentry (optional)
  SENTRY_DSN?: string;
  NEXT_PUBLIC_SENTRY_DSN?: string;
  SENTRY_AUTH_TOKEN?: string;

  // Microsoft Clarity (optional)
  NEXT_PUBLIC_CLARITY_ID?: string;

  // Logging
  LOG_LEVEL: LogLevel;

  // Feature Flags
  NEXT_PUBLIC_SHOW_BETA_BANNER: boolean;
  ENABLE_RATE_LIMITING: boolean;
  ENABLE_AUTH_DEBUG: boolean;

  // Fallback Configuration
  FALLBACK_ACTIVE_TERM_SEASON: string;
  FALLBACK_ACTIVE_TERM_YEAR: string;
}

/**
 * Detects the current environment
 */
function detectEnvironment(): Environment {
  // Vercel-specific environment detection
  if (process.env.VERCEL_ENV === "production") return "production";
  if (process.env.VERCEL_ENV === "preview") return "preview";
  if (process.env.VERCEL_ENV === "development") return "development";

  // Standard Node.js environment detection
  if (process.env.NODE_ENV === "test") return "test";
  if (process.env.NODE_ENV === "production") return "production";

  // Default to development for local development
  return "development";
}

/**
 * Gets a required environment variable or throws an error
 */
function getRequiredEnv(key: string, friendlyName?: string): string {
  const value = process.env[key];

  if (!value || value.trim() === "") {
    const name = friendlyName || key;
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Please set ${name} in your environment configuration.\n` +
        `See .env.example for reference.`
    );
  }

  return value;
}

/**
 * Gets an optional environment variable with a default value
 */
function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Parses a boolean environment variable
 */
function parseBoolean(
  value: string | undefined,
  defaultValue: boolean
): boolean {
  if (value === undefined || value === "") return defaultValue;
  return value === "true" || value === "1" || value === "yes";
}

/**
 * Validates log level
 */
function validateLogLevel(level: string): LogLevel {
  const validLevels: LogLevel[] = ["debug", "info", "warn", "error"];
  if (validLevels.includes(level as LogLevel)) {
    return level as LogLevel;
  }
  console.warn(`Invalid LOG_LEVEL "${level}", defaulting to "info"`);
  return "info";
}

/**
 * Creates and validates the environment configuration
 */
function createEnvConfig(): EnvConfig {
  const environment = detectEnvironment();
  const isDevelopment = environment === "development";
  const isProduction = environment === "production";
  const isPreview = environment === "preview";
  const isTest = environment === "test";

  // In development/test, some variables might not be required
  const requireAuth = isProduction || isPreview;

  return {
    // Environment detection
    NODE_ENV: process.env.NODE_ENV || "development",
    VERCEL_ENV: process.env.VERCEL_ENV,
    environment,
    isDevelopment,
    isProduction,
    isPreview,
    isTest,

    // Database
    DATABASE_URL: getRequiredEnv("DATABASE_URL", "Database connection URL"),

    // NextAuth
    NEXTAUTH_URL: getRequiredEnv("NEXTAUTH_URL", "NextAuth application URL"),
    NEXTAUTH_SECRET: requireAuth
      ? getRequiredEnv("NEXTAUTH_SECRET", "NextAuth secret key")
      : getOptionalEnv("NEXTAUTH_SECRET", "dev-secret-not-for-production"),
    NEXTAUTH_DEBUG: parseBoolean(process.env.NEXTAUTH_DEBUG, isDevelopment),

    // OneLogin OAuth
    ONELOGIN_CLIENT_ID: getRequiredEnv(
      "ONELOGIN_CLIENT_ID",
      "OneLogin Client ID"
    ),
    ONELOGIN_CLIENT_SECRET: getRequiredEnv(
      "ONELOGIN_CLIENT_SECRET",
      "OneLogin Client Secret"
    ),
    ONELOGIN_ISSUER: getOptionalEnv(
      "ONELOGIN_ISSUER",
      "https://smccd.onelogin.com/oidc/2"
    ),

    // Sentry (optional)
    SENTRY_DSN: process.env.SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,

    // Microsoft Clarity (optional)
    NEXT_PUBLIC_CLARITY_ID: process.env.NEXT_PUBLIC_CLARITY_ID,

    // Logging
    LOG_LEVEL: validateLogLevel(
      getOptionalEnv("LOG_LEVEL", isDevelopment ? "debug" : "error")
    ),

    // Feature Flags
    NEXT_PUBLIC_SHOW_BETA_BANNER: parseBoolean(
      process.env.NEXT_PUBLIC_SHOW_BETA_BANNER,
      !isProduction
    ),
    ENABLE_RATE_LIMITING: parseBoolean(
      process.env.ENABLE_RATE_LIMITING,
      isProduction
    ),
    ENABLE_AUTH_DEBUG: parseBoolean(
      process.env.ENABLE_AUTH_DEBUG,
      isDevelopment
    ),

    // Fallback Configuration
    FALLBACK_ACTIVE_TERM_SEASON: getOptionalEnv(
      "FALLBACK_ACTIVE_TERM_SEASON",
      "FALL"
    ),
    FALLBACK_ACTIVE_TERM_YEAR: getOptionalEnv(
      "FALLBACK_ACTIVE_TERM_YEAR",
      new Date().getFullYear().toString()
    ),
  };
}

// Create and export the validated configuration
let envConfig: EnvConfig;

try {
  envConfig = createEnvConfig();

  // Log environment info (non-sensitive)
  if (envConfig.isDevelopment) {
    console.log("🔧 Environment Configuration");
    console.log(`   Environment: ${envConfig.environment}`);
    console.log(`   Node ENV: ${envConfig.NODE_ENV}`);
    console.log(`   Log Level: ${envConfig.LOG_LEVEL}`);
    console.log(`   Beta Banner: ${envConfig.NEXT_PUBLIC_SHOW_BETA_BANNER}`);
    console.log(`   Rate Limiting: ${envConfig.ENABLE_RATE_LIMITING}`);
    console.log(`   Auth Debug: ${envConfig.ENABLE_AUTH_DEBUG}`);
  }
} catch (error) {
  console.error("❌ Environment Configuration Error:");
  console.error(error instanceof Error ? error.message : error);
  console.error("\nPlease check your environment variables and try again.");

  // In production, fail hard
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }

  // In development, throw to show in dev server
  throw error;
}

export const env = envConfig;

// Helper functions for common checks
export function isServerSide(): boolean {
  return typeof window === "undefined";
}

export function isClientSide(): boolean {
  return typeof window !== "undefined";
}

export function getBaseUrl(): string {
  if (isClientSide()) {
    return window.location.origin;
  }
  return env.NEXTAUTH_URL;
}
