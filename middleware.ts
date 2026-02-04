import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse, NextRequest } from "next/server";

// Initialize auth with edge-compatible config (no Prisma adapter)
const { auth } = NextAuth(authConfig);

/**
 * Detects if the request is from a test environment
 * Uses multiple secure checks to prevent spoofing
 */
function isTestEnvironment(): boolean {
  // Only trust environment variables, not headers or user agents
  return process.env.NODE_ENV === "test" || process.env.CYPRESS === "true";
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

// Public API routes that don't require authentication
const publicApiRoutes = [
  "/api/doorcards/public",
  "/api/doorcards/view",
  "/api/health",
  "/api/analytics/track",
  "/api/terms/active",
  "/api/auth", // Auth routes should always be public
];

/**
 * Main middleware function with proper authentication
 * Uses Auth.js v5 auth() function with edge-compatible config
 * Note: Rate limiting has been moved to API routes for Edge Runtime compatibility
 */
export default auth(async function middleware(req) {
  // Use simplified middleware only in test environments
  if (isTestEnvironment()) {
    return await testMiddleware(req);
  }

  // Check if this is a public API route
  const isPublicApiRoute = publicApiRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (isPublicApiRoute) {
    return NextResponse.next();
  }

  // For protected routes, check authentication via req.auth (provided by auth())
  const protectedRoutes = ["/dashboard", "/doorcard", "/admin", "/profile"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // If protected route and no auth, redirect to login
  if (isProtectedRoute && !req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isProtectedRoute) {
    const response = NextResponse.next();

    // Use private cache with must-revalidate for better performance
    response.headers.set("Cache-Control", "private, no-cache, must-revalidate");
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
});

export const config = {
  matcher: [
    // Protect specific routes that need authentication
    "/dashboard/:path*",
    "/doorcard/:path*",
    "/admin/:path*",
    "/profile/:path*",
    // Add API routes (rate limiting is handled in API routes themselves)
    "/api/:path*",
  ],
};
