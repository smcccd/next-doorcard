import { withAuth } from "next-auth/middleware";
import { NextResponse, NextRequest } from "next/server";
import {
  getRateLimitTier,
  getClientIdentifier,
  checkRateLimit,
  createRateLimitResponse,
} from "./lib/rate-limit";

/**
 * Detects if the request is from a test environment
 * Uses multiple secure checks to prevent spoofing
 */
function isTestEnvironment(): boolean {
  // Only trust environment variables, not headers or user agents
  return process.env.NODE_ENV === "test" || process.env.CYPRESS === "true";
}

/**
 * Apply rate limiting to API routes
 */
async function applyRateLimitingMiddleware(
  req: NextRequest
): Promise<NextResponse | null> {
  // Skip rate limiting in test environments
  if (isTestEnvironment()) {
    return null;
  }

  // Only apply rate limiting to API routes
  if (!req.nextUrl.pathname.startsWith("/api/")) {
    return null;
  }

  try {
    const tier = getRateLimitTier(req.nextUrl.pathname);
    const identifier = getClientIdentifier(req);
    const result = await checkRateLimit(tier, identifier);

    if (!result.success) {
      return new NextResponse(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: `Too many requests for ${result.tier} endpoints. Try again in ${result.retryAfter || 60} seconds.`,
          tier: result.tier,
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset.toISOString(),
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": result.limit.toString(),
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": result.reset.getTime().toString(),
            "Retry-After": (result.retryAfter || 60).toString(),
          },
        }
      );
    }

    return null; // Continue processing
  } catch (error) {
    // On error, allow the request but log the issue
    console.error(
      "[Rate Limit Middleware] Error applying rate limiting:",
      error
    );
    return null;
  }
}

/**
 * Middleware for test environment with simplified auth
 * Only used when NODE_ENV=test or CYPRESS=true
 */
async function testMiddleware(req: NextRequest): Promise<NextResponse> {
  const sessionToken =
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  // In development only, log basic info without sensitive data
  if (process.env.NODE_ENV === "development") {
    console.log("[TEST] Auth check:", {
      pathname: req.nextUrl.pathname,
      hasSession: !!sessionToken,
    });
  }

  const protectedRoutes = ["/dashboard", "/doorcard", "/admin", "/profile"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Redirect authenticated users away from login/home
  if (
    sessionToken &&
    (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/")
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users from protected routes
  if (!sessionToken && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

/**
 * Main middleware function with proper authentication and rate limiting
 * Uses NextAuth withAuth for production security
 */
export default withAuth(
  async function middleware(req) {
    // Apply rate limiting first (for API routes)
    const rateLimitResponse = await applyRateLimitingMiddleware(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Use simplified middleware only in test environments
    if (isTestEnvironment()) {
      return await testMiddleware(req);
    }

    // For protected routes, set appropriate cache headers
    const protectedRoutes = ["/dashboard", "/doorcard", "/admin", "/profile"];
    const isProtectedRoute = protectedRoutes.some((route) =>
      req.nextUrl.pathname.startsWith(route)
    );

    if (isProtectedRoute) {
      const response = NextResponse.next();

      // Use private cache with must-revalidate for better performance
      response.headers.set(
        "Cache-Control",
        "private, no-cache, must-revalidate"
      );
      // Important for CDN and browser caching with authentication
      response.headers.set("Vary", "Cookie");

      // Only set strict no-cache for admin pages
      if (req.nextUrl.pathname.startsWith("/admin")) {
        response.headers.set(
          "Cache-Control",
          "no-store, no-cache, must-revalidate, proxy-revalidate"
        );
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");
      }

      return response;
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow public API routes without authentication
        const publicApiRoutes = [
          "/api/doorcards/public",
          "/api/doorcards/view",
          "/api/health",
          "/api/analytics/track",
          "/api/terms/active",
        ];

        if (
          publicApiRoutes.some((route) =>
            req.nextUrl.pathname.startsWith(route)
          )
        ) {
          return true;
        }

        // User must have a valid token for protected routes
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    // Protect specific routes that need authentication
    "/dashboard/:path*",
    "/doorcard/:path*",
    "/admin/:path*",
    "/profile/:path*",
    // Add API routes for rate limiting (but not authentication)
    "/api/:path*",
  ],
};
