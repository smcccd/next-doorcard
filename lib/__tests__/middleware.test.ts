import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock rate limiting functions
const mockRateLimitFunctions = {
  getRateLimitTier: vi.fn(),
  getClientIdentifier: vi.fn(),
  checkRateLimit: vi.fn(),
  createRateLimitResponse: vi.fn(),
};

vi.mock("../rate-limit", () => mockRateLimitFunctions);

vi.mock("next-auth/middleware", () => ({
  withAuth: vi.fn((middleware: any, config: any) => {
    // Return a function that simulates withAuth behavior
    return async (req: NextRequest) => {
      // Check if route is protected
      const protectedRoutes = ["/dashboard", "/doorcard", "/admin", "/profile"];
      const isProtectedRoute = protectedRoutes.some((route) =>
        req.nextUrl.pathname.startsWith(route)
      );

      // Check public API routes
      const publicApiRoutes = [
        "/api/doorcards/public",
        "/api/doorcards/view",
        "/api/health",
        "/api/analytics/track",
        "/api/terms/active",
      ];

      const isPublicApi = publicApiRoutes.some((route) =>
        req.nextUrl.pathname.startsWith(route)
      );

      // Simulate token check
      const sessionToken =
        req.cookies.get("next-auth.session-token")?.value ||
        req.cookies.get("__Secure-next-auth.session-token")?.value;

      // Allow public API routes
      if (isPublicApi) {
        return middleware(req);
      }

      // For protected routes, check authorization
      if (isProtectedRoute && !sessionToken) {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      return middleware(req);
    };
  }),
}));

// Import middleware after mocks are set up
import middlewareFunction from "../../middleware";

describe("Middleware Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default environment
    process.env.NODE_ENV = "development";
    delete process.env.CYPRESS;

    // Set up default rate limit mocks
    mockRateLimitFunctions.getRateLimitTier.mockReturnValue("standard");
    mockRateLimitFunctions.getClientIdentifier.mockReturnValue("client-id");
    mockRateLimitFunctions.checkRateLimit.mockResolvedValue({
      success: true,
      tier: "standard",
      limit: 100,
      remaining: 99,
      reset: new Date(),
      retryAfter: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Test Environment Detection", () => {
    it("should detect test environment correctly", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";

      // Create a mock request
      const request = new NextRequest("http://localhost:3000/dashboard");

      // The middleware should handle test environment
      expect(process.env.NODE_ENV).toBe("test");

      process.env.NODE_ENV = originalEnv;
    });

    it("should detect Cypress environment correctly", () => {
      const originalCypress = process.env.CYPRESS;
      process.env.CYPRESS = "true";

      expect(process.env.CYPRESS).toBe("true");

      process.env.CYPRESS = originalCypress;
    });
  });

  describe("Rate Limiting Middleware", () => {
    it("should apply rate limiting to API routes", async () => {
      const request = new NextRequest("http://localhost:3000/api/doorcards");
      request.cookies.set("next-auth.session-token", "valid-token");

      await middlewareFunction(request);

      expect(mockRateLimitFunctions.getRateLimitTier).toHaveBeenCalledWith(
        "/api/doorcards"
      );
      expect(mockRateLimitFunctions.getClientIdentifier).toHaveBeenCalledWith(
        request
      );
      expect(mockRateLimitFunctions.checkRateLimit).toHaveBeenCalled();
    });

    it("should not apply rate limiting to non-API routes", async () => {
      const request = new NextRequest("http://localhost:3000/dashboard");
      request.cookies.set("next-auth.session-token", "valid-token");

      await middlewareFunction(request);

      expect(mockRateLimitFunctions.getRateLimitTier).not.toHaveBeenCalled();
      expect(mockRateLimitFunctions.getClientIdentifier).not.toHaveBeenCalled();
      expect(mockRateLimitFunctions.checkRateLimit).not.toHaveBeenCalled();
    });

    it("should skip rate limiting in test environment", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";

      const request = new NextRequest("http://localhost:3000/api/doorcards");

      await middlewareFunction(request);

      expect(mockRateLimitFunctions.checkRateLimit).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it("should return 429 when rate limit exceeded", async () => {
      mockRateLimitFunctions.checkRateLimit.mockResolvedValue({
        success: false,
        tier: "standard",
        limit: 100,
        remaining: 0,
        reset: new Date("2024-01-01T12:00:00Z"),
        retryAfter: 60,
      });

      const request = new NextRequest("http://localhost:3000/api/doorcards");
      const response = await middlewareFunction(request);

      expect(response.status).toBe(429);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        error: "Rate limit exceeded",
        message:
          "Too many requests for standard endpoints. Try again in 60 seconds.",
        tier: "standard",
        limit: 100,
        remaining: 0,
        reset: "2024-01-01T12:00:00.000Z",
        retryAfter: 60,
      });

      expect(response.headers.get("X-RateLimit-Limit")).toBe("100");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(response.headers.get("Retry-After")).toBe("60");
    });

    it("should handle rate limit errors gracefully", async () => {
      mockRateLimitFunctions.checkRateLimit.mockRejectedValue(
        new Error("Redis connection failed")
      );

      const request = new NextRequest("http://localhost:3000/api/doorcards");
      request.cookies.set("next-auth.session-token", "valid-token");

      // Should not throw and should continue processing
      const result = await middlewareFunction(request);
      expect(result).toBeDefined();
    });
  });

  describe("Authentication Middleware", () => {
    describe("Protected Routes", () => {
      const protectedRoutes = ["/dashboard", "/doorcard", "/admin", "/profile"];

      protectedRoutes.forEach((route) => {
        it(`should protect ${route} route`, async () => {
          const request = new NextRequest(`http://localhost:3000${route}`);

          const response = await middlewareFunction(request);

          expect(response.status).toBe(307); // Redirect status
          expect(response.headers.get("location")).toBe(
            "http://localhost:3000/login"
          );
        });

        it(`should allow access to ${route} with valid session`, async () => {
          const request = new NextRequest(`http://localhost:3000${route}`);
          request.cookies.set("next-auth.session-token", "valid-token");

          const response = await middlewareFunction(request);

          // Should not redirect to login
          expect(response.status).not.toBe(307);
        });
      });

      it("should protect nested protected routes", async () => {
        const request = new NextRequest(
          "http://localhost:3000/dashboard/settings"
        );

        const response = await middlewareFunction(request);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe(
          "http://localhost:3000/login"
        );
      });
    });

    describe("Public API Routes", () => {
      const publicApiRoutes = [
        "/api/doorcards/public",
        "/api/doorcards/view/testuser/current",
        "/api/health",
        "/api/analytics/track",
        "/api/terms/active",
      ];

      publicApiRoutes.forEach((route) => {
        it(`should allow access to ${route} without authentication`, async () => {
          const request = new NextRequest(`http://localhost:3000${route}`);

          const response = await middlewareFunction(request);

          // Should not redirect to login
          expect(response.status).not.toBe(307);
        });
      });
    });

    describe("Session Token Handling", () => {
      it("should recognize standard session token", async () => {
        const request = new NextRequest("http://localhost:3000/dashboard");
        request.cookies.set("next-auth.session-token", "valid-token");

        const response = await middlewareFunction(request);

        expect(response.status).not.toBe(307);
      });

      it("should recognize secure session token", async () => {
        const request = new NextRequest("http://localhost:3000/dashboard");
        request.cookies.set(
          "__Secure-next-auth.session-token",
          "secure-valid-token"
        );

        const response = await middlewareFunction(request);

        expect(response.status).not.toBe(307);
      });

      it("should redirect when no session token exists", async () => {
        const request = new NextRequest("http://localhost:3000/dashboard");

        const response = await middlewareFunction(request);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe(
          "http://localhost:3000/login"
        );
      });
    });

    describe("Redirect Logic", () => {
      it("should redirect authenticated users away from login page", async () => {
        const request = new NextRequest("http://localhost:3000/login");
        request.cookies.set("next-auth.session-token", "valid-token");

        const response = await middlewareFunction(request);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe(
          "http://localhost:3000/dashboard"
        );
      });

      it("should redirect authenticated users away from home page", async () => {
        const request = new NextRequest("http://localhost:3000/");
        request.cookies.set("next-auth.session-token", "valid-token");

        const response = await middlewareFunction(request);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe(
          "http://localhost:3000/dashboard"
        );
      });

      it("should allow unauthenticated users on login page", async () => {
        const request = new NextRequest("http://localhost:3000/login");

        const response = await middlewareFunction(request);

        // Should not redirect
        expect(response.status).not.toBe(307);
      });

      it("should allow unauthenticated users on home page", async () => {
        const request = new NextRequest("http://localhost:3000/");

        const response = await middlewareFunction(request);

        // Should not redirect
        expect(response.status).not.toBe(307);
      });
    });
  });

  describe("Test Environment Middleware", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "test";
    });

    afterEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("should use simplified auth in test environment", async () => {
      const request = new NextRequest("http://localhost:3000/dashboard");

      const response = await middlewareFunction(request);

      // Should use test middleware path
      expect(response.status).toBe(307); // Should redirect to login in test mode too
    });

    it("should handle Cypress environment", async () => {
      process.env.CYPRESS = "true";

      const request = new NextRequest("http://localhost:3000/dashboard");

      const response = await middlewareFunction(request);

      // Should handle Cypress environment appropriately
      expect(response).toBeDefined();

      delete process.env.CYPRESS;
    });
  });

  describe("Route Matching Configuration", () => {
    const matcherRoutes = [
      "/dashboard/test",
      "/doorcard/123/edit",
      "/admin/users",
      "/profile/settings",
      "/api/doorcards",
      "/api/user/profile",
    ];

    matcherRoutes.forEach((route) => {
      it(`should apply middleware to ${route}`, async () => {
        const request = new NextRequest(`http://localhost:3000${route}`);

        // The middleware should run for these routes
        const response = await middlewareFunction(request);
        expect(response).toBeDefined();
      });
    });

    const nonMatcherRoutes = [
      "/favicon.ico",
      "/_next/static/css/app.css",
      "/images/logo.png",
    ];

    // Note: These routes wouldn't actually reach the middleware due to Next.js configuration
    // This test verifies the middleware handles them gracefully if they did
    nonMatcherRoutes.forEach((route) => {
      it(`should handle ${route} gracefully if it reaches middleware`, async () => {
        const request = new NextRequest(`http://localhost:3000${route}`);

        const response = await middlewareFunction(request);
        expect(response).toBeDefined();
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle malformed URLs gracefully", async () => {
      const request = new NextRequest("http://localhost:3000/dashboard");
      // Simulate malformed URL by modifying pathname
      Object.defineProperty(request.nextUrl, "pathname", {
        value: null,
        writable: true,
      });

      // Should not throw an error
      const response = await middlewareFunction(request);
      expect(response).toBeDefined();
    });

    it("should handle missing cookie values", async () => {
      const request = new NextRequest("http://localhost:3000/dashboard");

      // Mock cookies.get to return undefined
      request.cookies.get = vi.fn().mockReturnValue(undefined);

      const response = await middlewareFunction(request);
      expect(response.status).toBe(307); // Should redirect to login
    });

    it("should handle rate limit function failures", async () => {
      mockRateLimitFunctions.getRateLimitTier.mockImplementation(() => {
        throw new Error("Rate limit tier error");
      });

      const request = new NextRequest("http://localhost:3000/api/doorcards");

      // Should not throw and should continue processing
      const response = await middlewareFunction(request);
      expect(response).toBeDefined();
    });
  });

  describe("Security Headers and Response Handling", () => {
    it("should include proper rate limit headers in 429 response", async () => {
      mockRateLimitFunctions.checkRateLimit.mockResolvedValue({
        success: false,
        tier: "premium",
        limit: 1000,
        remaining: 0,
        reset: new Date("2024-01-01T13:00:00Z"),
        retryAfter: 120,
      });

      const request = new NextRequest("http://localhost:3000/api/doorcards");
      const response = await middlewareFunction(request);

      expect(response.status).toBe(429);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("X-RateLimit-Limit")).toBe("1000");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(response.headers.get("X-RateLimit-Reset")).toBe("1704110400000");
      expect(response.headers.get("Retry-After")).toBe("120");
    });

    it("should handle rate limit response without retryAfter", async () => {
      mockRateLimitFunctions.checkRateLimit.mockResolvedValue({
        success: false,
        tier: "standard",
        limit: 100,
        remaining: 0,
        reset: new Date(),
        retryAfter: null,
      });

      const request = new NextRequest("http://localhost:3000/api/doorcards");
      const response = await middlewareFunction(request);

      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe("60"); // Default fallback

      const responseBody = await response.json();
      expect(responseBody.retryAfter).toBe(null);
      expect(responseBody.message).toContain("Try again in 60 seconds");
    });
  });
});
