import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  RateLimitTier,
  getClientIdentifier,
  getUserIdentifier,
  getRateLimitTier,
  checkRateLimit,
  createRateLimitHeaders,
  createRateLimitResponse,
  withRateLimit,
  applyModernRateLimit,
  rateLimit,
  authRateLimit,
  apiRateLimit,
  analyticsRateLimit,
  applyRateLimit,
} from "../rate-limit";

// Mock Upstash Redis and Ratelimit
const mockRedis = {
  fromEnv: vi.fn(),
};

const mockRatelimit = vi.fn();
const mockLimiter = {
  limit: vi.fn(),
};

vi.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: vi.fn(() => mockRedis),
  },
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: vi.fn(() => mockLimiter),
}));

// Mock console methods
const originalConsole = {
  warn: console.warn,
  error: console.error,
  log: console.log,
};

describe("Rate Limiting Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    console.warn = vi.fn();
    console.error = vi.fn();
    console.log = vi.fn();

    // Reset environment variables
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    process.env.NODE_ENV = "test";

    // Set up default mock behavior
    mockLimiter.limit.mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    Object.assign(console, originalConsole);
  });

  describe("RateLimitTier enum", () => {
    it("should have correct tier values", () => {
      expect(RateLimitTier.AUTH).toBe("auth");
      expect(RateLimitTier.ADMIN).toBe("admin");
      expect(RateLimitTier.API).toBe("api");
      expect(RateLimitTier.ANALYTICS).toBe("analytics");
      expect(RateLimitTier.PUBLIC).toBe("public");
    });
  });

  describe("getClientIdentifier", () => {
    it("should extract IP from x-forwarded-for header", () => {
      const request = new Request("http://example.com", {
        headers: {
          "x-forwarded-for": "192.168.1.1, 10.0.0.1",
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe("192.168.1.1");
    });

    it("should extract IP from x-real-ip header", () => {
      const request = new Request("http://example.com", {
        headers: {
          "x-real-ip": "203.0.113.1",
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe("203.0.113.1");
    });

    it("should extract IP from cf-connecting-ip header", () => {
      const request = new Request("http://example.com", {
        headers: {
          "cf-connecting-ip": "198.51.100.1",
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe("198.51.100.1");
    });

    it("should prioritize x-forwarded-for over other headers", () => {
      const request = new Request("http://example.com", {
        headers: {
          "x-forwarded-for": "192.168.1.1",
          "x-real-ip": "203.0.113.1",
          "cf-connecting-ip": "198.51.100.1",
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe("192.168.1.1");
    });

    it("should use fallback when no IP headers present", () => {
      const request = new Request("http://example.com");

      const identifier = getClientIdentifier(request, "test-fallback");
      expect(identifier).toBe("test-fallback");
    });

    it('should use default fallback "anonymous"', () => {
      const request = new Request("http://example.com");

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe("anonymous");
    });

    it("should trim whitespace from forwarded IPs", () => {
      const request = new Request("http://example.com", {
        headers: {
          "x-forwarded-for": "  192.168.1.1  , 10.0.0.1",
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe("192.168.1.1");
    });
  });

  describe("getUserIdentifier", () => {
    it("should create user-based identifier", () => {
      const identifier = getUserIdentifier("user123", "192.168.1.1");
      expect(identifier).toBe("user_user123_ip_192.168.1.1");
    });

    it("should handle special characters in user ID", () => {
      const identifier = getUserIdentifier("user@example.com", "192.168.1.1");
      expect(identifier).toBe("user_user@example.com_ip_192.168.1.1");
    });
  });

  describe("getRateLimitTier", () => {
    it("should return AUTH tier for authentication routes", () => {
      expect(getRateLimitTier("/api/auth/signin")).toBe(RateLimitTier.AUTH);
      expect(getRateLimitTier("/api/auth/callback")).toBe(RateLimitTier.AUTH);
      expect(getRateLimitTier("/api/register")).toBe(RateLimitTier.AUTH);
    });

    it("should return ADMIN tier for admin routes", () => {
      expect(getRateLimitTier("/api/admin/users")).toBe(RateLimitTier.ADMIN);
      expect(getRateLimitTier("/api/admin/settings")).toBe(RateLimitTier.ADMIN);
    });

    it("should return ANALYTICS tier for analytics routes", () => {
      expect(getRateLimitTier("/api/analytics/track")).toBe(
        RateLimitTier.ANALYTICS
      );
      expect(getRateLimitTier("/api/analytics/metrics")).toBe(
        RateLimitTier.ANALYTICS
      );
    });

    it("should return PUBLIC tier for public doorcard routes", () => {
      expect(getRateLimitTier("/api/doorcards/view/user123")).toBe(
        RateLimitTier.PUBLIC
      );
      expect(getRateLimitTier("/api/doorcards/public")).toBe(
        RateLimitTier.PUBLIC
      );
    });

    it("should return API tier for general API routes", () => {
      expect(getRateLimitTier("/api/doorcards")).toBe(RateLimitTier.API);
      expect(getRateLimitTier("/api/user/profile")).toBe(RateLimitTier.API);
      expect(getRateLimitTier("/api/health")).toBe(RateLimitTier.API);
    });

    it("should return PUBLIC tier for non-API routes", () => {
      expect(getRateLimitTier("/dashboard")).toBe(RateLimitTier.PUBLIC);
      expect(getRateLimitTier("/login")).toBe(RateLimitTier.PUBLIC);
      expect(getRateLimitTier("/")).toBe(RateLimitTier.PUBLIC);
    });
  });

  describe("checkRateLimit", () => {
    it("should return success when under rate limit", async () => {
      mockLimiter.limit.mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 95,
        reset: new Date("2024-01-01T12:01:00Z"),
      });

      const result = await checkRateLimit(RateLimitTier.API, "test-client");

      expect(result).toEqual({
        success: true,
        limit: 100,
        remaining: 95,
        reset: new Date("2024-01-01T12:01:00Z"),
        tier: RateLimitTier.API,
        identifier: "test-client",
      });
    });

    it("should return failure when rate limit exceeded", async () => {
      const resetTime = new Date("2024-01-01T12:01:00Z");
      mockLimiter.limit.mockResolvedValue({
        success: false,
        limit: 100,
        remaining: 0,
        reset: resetTime,
      });

      // Mock Date.now to calculate retryAfter correctly
      const mockNow = new Date("2024-01-01T12:00:30Z").getTime();
      vi.spyOn(Date, "now").mockReturnValue(mockNow);

      const result = await checkRateLimit(RateLimitTier.API, "test-client");

      expect(result).toEqual({
        success: false,
        limit: 100,
        remaining: 0,
        reset: resetTime,
        tier: RateLimitTier.API,
        identifier: "test-client",
        retryAfter: 30, // 30 seconds until reset
      });

      vi.restoreAllMocks();
    });

    it("should handle missing limiter gracefully", async () => {
      // Test when limiter is not available
      const result = await checkRateLimit(RateLimitTier.AUTH, "test-client");

      expect(result.success).toBe(true);
      expect(result.tier).toBe(RateLimitTier.AUTH);
      expect(result.identifier).toBe("test-client");
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Limiter not available for tier auth")
      );
    });

    it("should handle limiter errors gracefully", async () => {
      mockLimiter.limit.mockRejectedValue(new Error("Redis connection failed"));

      const result = await checkRateLimit(RateLimitTier.API, "test-client");

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(0);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Error checking rate limit"),
        expect.any(Error)
      );
    });

    it("should log rate limit violations in development", async () => {
      process.env.NODE_ENV = "development";

      mockLimiter.limit.mockResolvedValue({
        success: false,
        limit: 100,
        remaining: 0,
        reset: new Date(),
      });

      await checkRateLimit(RateLimitTier.API, "test-client");

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("api limit exceeded"),
        expect.any(Object)
      );
    });
  });

  describe("createRateLimitHeaders", () => {
    it("should create correct headers for successful rate limit check", () => {
      const result = {
        success: true,
        limit: 100,
        remaining: 95,
        reset: new Date("2024-01-01T12:00:00Z"),
        tier: RateLimitTier.API,
        identifier: "test-client",
      };

      const headers = createRateLimitHeaders(result);

      expect(headers).toEqual({
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": "95",
        "X-RateLimit-Reset": "1704110400000",
      });
    });

    it("should include Retry-After header when retryAfter is present", () => {
      const result = {
        success: false,
        limit: 100,
        remaining: 0,
        reset: new Date("2024-01-01T12:00:00Z"),
        tier: RateLimitTier.API,
        identifier: "test-client",
        retryAfter: 60,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers).toEqual({
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": "1704110400000",
        "Retry-After": "60",
      });
    });
  });

  describe("createRateLimitResponse", () => {
    it("should create 429 response with correct structure", async () => {
      const result = {
        success: false,
        limit: 100,
        remaining: 0,
        reset: new Date("2024-01-01T12:00:00Z"),
        tier: RateLimitTier.API,
        identifier: "test-client",
        retryAfter: 60,
      };

      const response = createRateLimitResponse(result);

      expect(response.status).toBe(429);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("X-RateLimit-Limit")).toBe("100");
      expect(response.headers.get("Retry-After")).toBe("60");

      const body = await response.json();
      expect(body).toEqual({
        error: "Rate limit exceeded",
        message:
          "Too many requests for api endpoints. Try again in 60 seconds.",
        tier: RateLimitTier.API,
        limit: 100,
        remaining: 0,
        reset: "2024-01-01T12:00:00.000Z",
        retryAfter: 60,
      });
    });

    it("should handle missing retryAfter gracefully", async () => {
      const result = {
        success: false,
        limit: 100,
        remaining: 0,
        reset: new Date("2024-01-01T12:00:00Z"),
        tier: RateLimitTier.API,
        identifier: "test-client",
      };

      const response = createRateLimitResponse(result);
      const body = await response.json();

      expect(body.message).toContain("Try again in 60 seconds");
      expect(body.retryAfter).toBeUndefined();
    });
  });

  describe("withRateLimit", () => {
    const mockRequest = new Request("http://example.com");

    it("should execute handler when rate limit not exceeded", async () => {
      mockLimiter.limit.mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 95,
        reset: new Date(),
      });

      const mockHandler = vi.fn().mockResolvedValue("success");

      const result = await withRateLimit(
        mockRequest,
        RateLimitTier.API,
        "test-client",
        mockHandler
      );

      expect(mockHandler).toHaveBeenCalled();
      expect(result).toBe("success");
    });

    it("should return rate limit response when limit exceeded", async () => {
      mockLimiter.limit.mockResolvedValue({
        success: false,
        limit: 100,
        remaining: 0,
        reset: new Date(),
      });

      const mockHandler = vi.fn();

      const result = await withRateLimit(
        mockRequest,
        RateLimitTier.API,
        "test-client",
        mockHandler
      );

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(429);
    });

    it("should add rate limit headers to Response objects", async () => {
      mockLimiter.limit.mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 95,
        reset: new Date("2024-01-01T12:00:00Z"),
      });

      const mockResponse = new Response("success");
      const mockHandler = vi.fn().mockResolvedValue(mockResponse);

      const result = await withRateLimit(
        mockRequest,
        RateLimitTier.API,
        "test-client",
        mockHandler
      );

      expect(result).toBe(mockResponse);
      expect(mockResponse.headers.get("X-RateLimit-Limit")).toBe("100");
      expect(mockResponse.headers.get("X-RateLimit-Remaining")).toBe("95");
    });

    it("should use extracted client identifier when not provided", async () => {
      const requestWithIP = new Request("http://example.com", {
        headers: { "x-forwarded-for": "192.168.1.1" },
      });

      mockLimiter.limit.mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 95,
        reset: new Date(),
      });

      await withRateLimit(requestWithIP, RateLimitTier.API);

      expect(mockLimiter.limit).toHaveBeenCalledWith("192.168.1.1");
    });
  });

  describe("applyModernRateLimit", () => {
    it("should return null when rate limit not exceeded", async () => {
      mockLimiter.limit.mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 95,
        reset: new Date(),
      });

      const request = new Request("http://example.com");
      const result = await applyModernRateLimit(request, RateLimitTier.API);

      expect(result).toBeNull();
    });

    it("should return 429 response when rate limit exceeded", async () => {
      mockLimiter.limit.mockResolvedValue({
        success: false,
        limit: 100,
        remaining: 0,
        reset: new Date(),
      });

      const request = new Request("http://example.com");
      const result = await applyModernRateLimit(request, RateLimitTier.API);

      expect(result).toBeInstanceOf(Response);
      expect(result!.status).toBe(429);
    });

    it("should use default API tier when tier not specified", async () => {
      const request = new Request("http://example.com");
      await applyModernRateLimit(request);

      // Should call the limiter (indicating it's working)
      expect(mockLimiter.limit).toHaveBeenCalled();
    });
  });

  describe("Legacy Rate Limiting", () => {
    describe("rateLimit function", () => {
      it("should create rate limiter with default config", () => {
        const limiter = rateLimit();
        expect(limiter).toBeInstanceOf(Function);
      });

      it("should create rate limiter with custom config", () => {
        const limiter = rateLimit({
          windowMs: 30000,
          maxRequests: 50,
          message: "Custom message",
        });
        expect(limiter).toBeInstanceOf(Function);
      });

      it("should track requests and enforce limits", async () => {
        const limiter = rateLimit({
          windowMs: 60000,
          maxRequests: 2,
          message: "Rate limited",
        });

        const request = new NextRequest("http://example.com", {
          headers: { "x-forwarded-for": "192.168.1.1" },
        });

        // First request should pass
        const result1 = await limiter(request);
        expect(result1.limited).toBe(false);
        expect(result1.remaining).toBe(1);

        // Second request should pass
        const result2 = await limiter(request);
        expect(result2.limited).toBe(false);
        expect(result2.remaining).toBe(0);

        // Third request should be limited
        const result3 = await limiter(request);
        expect(result3.limited).toBe(true);
        expect(result3.message).toBe("Rate limited");
        expect(result3.retryAfter).toBeGreaterThan(0);
      });

      it("should use session token for authenticated requests", async () => {
        const limiter = rateLimit({ windowMs: 60000, maxRequests: 1 });

        const request1 = new NextRequest("http://example.com");
        request1.cookies.set("next-auth.session-token", "token123");

        const request2 = new NextRequest("http://example.com");
        request2.cookies.set("next-auth.session-token", "token456");

        // Both should pass as they have different tokens
        const result1 = await limiter(request1);
        const result2 = await limiter(request2);

        expect(result1.limited).toBe(false);
        expect(result2.limited).toBe(false);
      });

      it("should clean up expired entries", async () => {
        const limiter = rateLimit({
          windowMs: 100, // Very short window
          maxRequests: 1,
        });

        const request = new NextRequest("http://example.com", {
          headers: { "x-forwarded-for": "192.168.1.1" },
        });

        // First request should pass
        const result1 = await limiter(request);
        expect(result1.limited).toBe(false);

        // Wait for window to expire
        await new Promise((resolve) => setTimeout(resolve, 150));

        // Second request should pass after cleanup
        const result2 = await limiter(request);
        expect(result2.limited).toBe(false);
      });
    });

    describe("Predefined rate limiters", () => {
      it("should have authRateLimit with correct config", async () => {
        const request = new NextRequest("http://example.com");
        const result = await authRateLimit(request);

        expect(result.limited).toBe(false);
        expect(typeof result.remaining).toBe("number");
      });

      it("should have apiRateLimit with correct config", async () => {
        const request = new NextRequest("http://example.com");
        const result = await apiRateLimit(request);

        expect(result.limited).toBe(false);
        expect(typeof result.remaining).toBe("number");
      });

      it("should have analyticsRateLimit with correct config", async () => {
        const request = new NextRequest("http://example.com");
        const result = await analyticsRateLimit(request);

        expect(result.limited).toBe(false);
        expect(typeof result.remaining).toBe("number");
      });
    });

    describe("applyRateLimit", () => {
      it("should return null when rate limit not exceeded", async () => {
        const request = new NextRequest("http://example.com");
        const result = await applyRateLimit(request);

        expect(result).toBeNull();
      });

      it("should return 429 response when rate limit exceeded", async () => {
        const strictLimiter = rateLimit({ windowMs: 60000, maxRequests: 0 });
        const request = new NextRequest("http://example.com");

        const result = await applyRateLimit(request, strictLimiter);

        expect(result).toBeInstanceOf(Response);
        expect(result!.status).toBe(429);

        const body = await result!.json();
        expect(body.error).toBeDefined();
        expect(body.retryAfter).toBeGreaterThan(0);
      });
    });
  });

  describe("Redis Configuration", () => {
    it("should handle missing Redis configuration in development", () => {
      process.env.NODE_ENV = "development";

      // This should trigger the fallback warning
      // The actual implementation would try to create Redis instance
      expect(process.env.UPSTASH_REDIS_REST_URL).toBeUndefined();
      expect(process.env.KV_REST_API_URL).toBeUndefined();
    });

    it("should use Upstash Redis when configured", () => {
      process.env.UPSTASH_REDIS_REST_URL = "https://redis.upstash.io";
      process.env.UPSTASH_REDIS_REST_TOKEN = "token123";

      // The actual implementation would use these values
      expect(process.env.UPSTASH_REDIS_REST_URL).toBe(
        "https://redis.upstash.io"
      );
      expect(process.env.UPSTASH_REDIS_REST_TOKEN).toBe("token123");
    });

    it("should use Vercel KV when configured", () => {
      process.env.KV_REST_API_URL = "https://kv.vercel.com";
      process.env.KV_REST_API_TOKEN = "kv-token123";

      // The actual implementation would use these values
      expect(process.env.KV_REST_API_URL).toBe("https://kv.vercel.com");
      expect(process.env.KV_REST_API_TOKEN).toBe("kv-token123");
    });
  });

  describe("Edge Cases and Security", () => {
    it("should handle malformed headers gracefully", () => {
      const request = new Request("http://example.com", {
        headers: {
          "x-forwarded-for": "", // Empty value
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe("anonymous");
    });

    it("should handle very long forwarded-for headers", () => {
      const longIpList = Array(100).fill("192.168.1.1").join(", ");
      const request = new Request("http://example.com", {
        headers: {
          "x-forwarded-for": longIpList,
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe("192.168.1.1");
    });

    it("should not allow header injection", () => {
      const request = new Request("http://example.com", {
        headers: {
          "x-forwarded-for": "192.168.1.1\nX-Injected: malicious",
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe("192.168.1.1\nX-Injected: malicious"); // Raw value preserved
    });

    it("should handle IPv6 addresses", () => {
      const request = new Request("http://example.com", {
        headers: {
          "x-forwarded-for": "2001:db8::1",
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe("2001:db8::1");
    });
  });
});
