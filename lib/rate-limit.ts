import { NextRequest } from "next/server";

// Simple in-memory rate limiter (for production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

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

// Specific rate limiters for different endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  message: "Too many API requests. Please slow down.",
});

export const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 registrations per hour
  message: "Too many registration attempts. Please try again later.",
});

export const analyticsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 120, // 120 tracking events per minute
  message: "Too many tracking requests.",
});

// Helper to apply rate limit in API routes
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
          "X-RateLimit-Limit": rateLimiter.toString(),
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
