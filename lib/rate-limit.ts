import { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limit tiers for different types of routes
 */
export enum RateLimitTier {
  AUTH = "auth", // Authentication routes (strictest)
  ADMIN = "admin", // Admin routes
  API = "api", // General API routes
  ANALYTICS = "analytics", // Analytics tracking (most lenient)
  PUBLIC = "public", // Public routes (doorcard views)
}

// Legacy interface for backward compatibility
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

/**
 * Rate limit configuration for each tier
 */
const RATE_LIMIT_CONFIG = {
  [RateLimitTier.AUTH]: {
    requests: 5,
    window: "60 s", // 5 requests per minute for auth
    description: "Authentication routes",
  },
  [RateLimitTier.ADMIN]: {
    requests: 50,
    window: "60 s", // 50 requests per minute for admin
    description: "Admin routes",
  },
  [RateLimitTier.API]: {
    requests: 100,
    window: "60 s", // 100 requests per minute for general API
    description: "General API routes",
  },
  [RateLimitTier.ANALYTICS]: {
    requests: 200,
    window: "60 s", // 200 requests per minute for analytics
    description: "Analytics tracking",
  },
  [RateLimitTier.PUBLIC]: {
    requests: 300,
    window: "60 s", // 300 requests per minute for public views
    description: "Public doorcard views",
  },
} as const;

// Legacy in-memory rate limiter for fallback
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Create Redis instance with fallback to in-memory
 */
function createRedisInstance() {
  try {
    // Check if Redis credentials are available
    if (
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      return Redis.fromEnv();
    }

    // Check for Vercel KV
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      return new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      });
    }

    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Rate Limit] Redis not configured, falling back to in-memory storage"
      );
    }
    return null;
  } catch (error) {
    console.warn(
      "[Rate Limit] Failed to connect to Redis, using in-memory fallback:",
      error
    );
    return null;
  }
}

/**
 * Rate limiters for each tier using Upstash
 */
class ModernRateLimiters {
  private static instance: ModernRateLimiters;
  private limiters: Map<RateLimitTier, Ratelimit>;
  private redis: Redis | null;

  private constructor() {
    this.redis = createRedisInstance();
    this.limiters = new Map();
    this.initializeLimiters();
  }

  public static getInstance(): ModernRateLimiters {
    if (!ModernRateLimiters.instance) {
      ModernRateLimiters.instance = new ModernRateLimiters();
    }
    return ModernRateLimiters.instance;
  }

  private initializeLimiters() {
    for (const [tier, config] of Object.entries(RATE_LIMIT_CONFIG)) {
      try {
        const ratelimitConfig: any = {
          limiter: Ratelimit.slidingWindow(config.requests, config.window),
          analytics: true,
          prefix: `doorcard_ratelimit_${tier}`,
        };

        // Only add redis if it's available to avoid type issues
        if (this.redis) {
          ratelimitConfig.redis = this.redis;
        }

        const limiter = new Ratelimit(ratelimitConfig);

        this.limiters.set(tier as RateLimitTier, limiter);

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Rate Limit] Initialized ${tier} limiter: ${config.requests} requests per ${config.window}`
          );
        }
      } catch (error) {
        console.error(
          `[Rate Limit] Failed to initialize ${tier} limiter:`,
          error
        );
      }
    }
  }

  public getLimiter(tier: RateLimitTier): Ratelimit | null {
    return this.limiters.get(tier) || null;
  }

  public isRedisConnected(): boolean {
    return this.redis !== null;
  }
}

/**
 * Rate limit result with additional metadata
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number; // seconds until next request allowed
  tier: RateLimitTier;
  identifier: string;
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(
  request: Request,
  fallback = "anonymous"
): string {
  // Try to get IP from various headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  // Use the first available IP, fallback to provided default
  const ip =
    forwardedFor?.split(",")[0]?.trim() || realIp || cfConnectingIp || fallback;

  return ip;
}

/**
 * Get user-based identifier for authenticated requests
 */
export function getUserIdentifier(userId: string, ip: string): string {
  return `user_${userId}_ip_${ip}`;
}

/**
 * Check rate limit for a given tier and identifier
 */
export async function checkRateLimit(
  tier: RateLimitTier,
  identifier: string
): Promise<RateLimitResult> {
  const rateLimiters = ModernRateLimiters.getInstance();
  const limiter = rateLimiters.getLimiter(tier);

  if (!limiter) {
    // If rate limiter is not available, allow the request but log warning
    console.warn(
      `[Rate Limit] Limiter not available for tier ${tier}, allowing request`
    );
    return {
      success: true,
      limit: RATE_LIMIT_CONFIG[tier].requests,
      remaining: RATE_LIMIT_CONFIG[tier].requests,
      reset: new Date(Date.now() + 60000), // 1 minute from now
      tier,
      identifier,
    };
  }

  try {
    const result = await limiter.limit(identifier);

    // Ensure reset is a Date object - handle various formats from Upstash
    const resetDate = new Date(result.reset as any);

    const rateLimitResult: RateLimitResult = {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: resetDate,
      tier,
      identifier,
    };

    // Calculate retry-after if rate limited
    if (!result.success && resetDate) {
      rateLimitResult.retryAfter = Math.ceil(
        (resetDate.getTime() - Date.now()) / 1000
      );
    }

    // Log rate limit violations in development
    if (!result.success && process.env.NODE_ENV === "development") {
      console.warn(`[Rate Limit] ${tier} limit exceeded for ${identifier}:`, {
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter: rateLimitResult.retryAfter,
      });
    }

    return rateLimitResult;
  } catch (error) {
    console.error(`[Rate Limit] Error checking rate limit for ${tier}:`, error);

    // On error, allow the request but log the issue
    return {
      success: true,
      limit: RATE_LIMIT_CONFIG[tier].requests,
      remaining: 0,
      reset: new Date(Date.now() + 60000),
      tier,
      identifier,
    };
  }
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.getTime().toString(),
  };

  if (result.retryAfter) {
    headers["Retry-After"] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Create a 429 Rate Limit Exceeded response
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  const headers = createRateLimitHeaders(result);

  const body = {
    error: "Rate limit exceeded",
    message: `Too many requests for ${result.tier} endpoints. Try again in ${result.retryAfter || 60} seconds.`,
    tier: result.tier,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset.toISOString(),
    retryAfter: result.retryAfter,
  };

  return new Response(JSON.stringify(body), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

/**
 * Utility to get rate limit tier from pathname
 */
export function getRateLimitTier(pathname: string): RateLimitTier {
  // Authentication routes
  if (pathname.includes("/api/auth") || pathname.includes("/api/register")) {
    return RateLimitTier.AUTH;
  }

  // Admin routes
  if (pathname.includes("/api/admin")) {
    return RateLimitTier.ADMIN;
  }

  // Analytics routes
  if (pathname.includes("/api/analytics")) {
    return RateLimitTier.ANALYTICS;
  }

  // Public doorcard views
  if (
    pathname.includes("/api/doorcards/view") ||
    pathname.includes("/api/doorcards/public")
  ) {
    return RateLimitTier.PUBLIC;
  }

  // Default to API tier for other API routes
  if (pathname.startsWith("/api/")) {
    return RateLimitTier.API;
  }

  // Default for non-API routes
  return RateLimitTier.PUBLIC;
}

/**
 * Rate limiting middleware function for use in API routes
 */
export async function withRateLimit<T>(
  request: Request,
  tier: RateLimitTier,
  identifier?: string,
  handler?: () => Promise<T>
): Promise<T | Response> {
  const clientId = identifier || getClientIdentifier(request);
  const result = await checkRateLimit(tier, clientId);

  if (!result.success) {
    return createRateLimitResponse(result);
  }

  if (handler) {
    const response = await handler();

    // Add rate limit headers to successful responses if it's a Response object
    if (response instanceof Response) {
      const headers = createRateLimitHeaders(result);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  }

  return result as T;
}

// ========================================
// LEGACY FUNCTIONS (for backward compatibility)
// ========================================

export function rateLimit(
  config: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute default
    maxRequests: 60, // 60 requests per minute default
    message: "Too many requests, please try again later.",
  }
) {
  return async function rateLimitMiddleware(req: NextRequest) {
    // Get identifier (IP address or user ID)
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";

    // For authenticated requests, use user ID if available
    const sessionToken =
      req.cookies.get("next-auth.session-token")?.value ||
      req.cookies.get("__Secure-next-auth.session-token")?.value;

    const identifier = sessionToken
      ? `user:${sessionToken.substring(0, 16)}`
      : `ip:${ip}`;
    const now = Date.now();

    // Clean up expired entries
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key);
      }
    }

    // Get or create rate limit entry
    let rateLimitInfo = rateLimitMap.get(identifier);

    if (!rateLimitInfo || rateLimitInfo.resetTime < now) {
      rateLimitInfo = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      rateLimitMap.set(identifier, rateLimitInfo);
    }

    // Check if limit exceeded
    if (rateLimitInfo.count >= config.maxRequests) {
      const retryAfter = Math.ceil((rateLimitInfo.resetTime - now) / 1000);
      return {
        limited: true,
        retryAfter,
        message: config.message,
      };
    }

    // Increment counter
    rateLimitInfo.count++;

    return {
      limited: false,
      remaining: config.maxRequests - rateLimitInfo.count,
      reset: rateLimitInfo.resetTime,
    };
  };
}

// Legacy rate limiters (updated to use modern tier system when possible)
export const authRateLimit = rateLimit({
  windowMs: 60 * 1000, // Updated to 1 minute (was 15 minutes)
  maxRequests: 5, // 5 attempts per minute
  message: "Too many authentication attempts. Please try again in 1 minute.",
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // Updated to match modern API tier
  message: "Too many API requests. Please slow down.",
});

export const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 registrations per hour
  message: "Too many registration attempts. Please try again later.",
});

export const analyticsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 200, // Updated to match modern analytics tier
  message: "Too many tracking requests.",
});

// Helper to apply rate limit in API routes (legacy version)
export async function applyRateLimit(
  req: NextRequest,
  rateLimiter = apiRateLimit
) {
  const result = await rateLimiter(req);

  if (result.limited) {
    return new Response(
      JSON.stringify({
        error: result.message,
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": result.retryAfter?.toString() || "60",
          "X-RateLimit-Limit": "100", // Default to API tier limit
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(
            Date.now() + (result.retryAfter || 60) * 1000
          ).toISOString(),
        },
      }
    );
  }

  return null; // No rate limit hit
}

// ========================================
// MODERN API (Recommended for new code)
// ========================================

/**
 * Modern rate limiting helper for API routes using the new tier system
 *
 * Usage:
 * ```typescript
 * export async function GET(request: Request) {
 *   return withRateLimit(request, RateLimitTier.API, undefined, async () => {
 *     // Your API logic here
 *     return NextResponse.json({ data: "success" });
 *   });
 * }
 * ```
 */
export async function applyModernRateLimit(
  request: Request,
  tier: RateLimitTier = RateLimitTier.API,
  identifier?: string
): Promise<Response | null> {
  const clientId = identifier || getClientIdentifier(request);
  const result = await checkRateLimit(tier, clientId);

  if (!result.success) {
    return createRateLimitResponse(result);
  }

  return null; // No rate limit hit
}

export default ModernRateLimiters;
