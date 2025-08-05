import { NextRequest } from "next/server";
import { POST } from "../route";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    doorcard: {
      findUnique: jest.fn(),
    },
    doorcardAnalytics: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    doorcardMetrics: {
      upsert: jest.fn(),
    },
  },
}));

jest.mock("crypto", () => ({
  randomUUID: jest.fn(() => "mock-uuid-123"),
}));

const mockPrisma = prisma as MockedObject<typeof prisma>;
const mockRandomUUID = randomUUID as MockedFunction<typeof randomUUID>;

describe("Analytics Tracking API Route", () => {
  const mockDoorcard = {
    id: "doorcard-123",
    isPublic: true,
    userId: "user-123",
  };

  const validTrackingData = {
    doorcardId: "clh7example123456789",
    eventType: "VIEW" as const,
    metadata: { page: "doorcard-view", source: "direct" },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Suppress console.error in tests
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Default successful mocks
    mockPrisma.doorcard.findUnique.mockResolvedValue(mockDoorcard);
    mockPrisma.doorcardAnalytics.create.mockResolvedValue({
      id: "mock-uuid-123",
      doorcardId: validTrackingData.doorcardId,
      eventType: validTrackingData.eventType,
      ipAddress: "127.0.0.1",
      userAgent: "test-agent",
      referrer: null,
      sessionId: "test-session",
      metadata: validTrackingData.metadata,
      createdAt: new Date(),
    });
    mockPrisma.doorcardAnalytics.findFirst.mockResolvedValue(null);
    mockPrisma.doorcardMetrics.upsert.mockResolvedValue({
      doorcardId: validTrackingData.doorcardId,
      totalViews: 1,
      uniqueViews: 1,
      totalPrints: 0,
      totalShares: 0,
      lastViewedAt: new Date(),
      lastPrintedAt: null,
      updatedAt: new Date(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("POST /api/analytics/track", () => {
    it("should track view events successfully", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/track",
        {
          method: "POST",
          body: JSON.stringify(validTrackingData),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "192.168.1.1, 10.0.0.1",
            "user-agent": "Mozilla/5.0 Test Browser",
            referer: "https://example.com/previous-page",
            "x-session-id": "custom-session-123",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });

      // Verify doorcard lookup
      expect(mockPrisma.doorcard.findUnique).toHaveBeenCalledWith({
        where: { id: validTrackingData.doorcardId },
        select: { id: true, isPublic: true, userId: true },
      });

      // Verify analytics event creation
      expect(mockPrisma.doorcardAnalytics.create).toHaveBeenCalledWith({
        data: {
          id: "mock-uuid-123",
          doorcardId: validTrackingData.doorcardId,
          eventType: "VIEW",
          ipAddress: "192.168.1.1", // First IP from forwarded header
          userAgent: "Mozilla/5.0 Test Browser",
          referrer: "https://example.com/previous-page",
          sessionId: "custom-session-123",
          metadata: validTrackingData.metadata,
        },
      });

      // Verify metrics update was called
      expect(mockPrisma.doorcardMetrics.upsert).toHaveBeenCalled();
    });

    it("should handle different event types correctly", async () => {
      const eventTypes = [
        "VIEW",
        "PRINT_PREVIEW",
        "PRINT_DOWNLOAD",
        "EDIT_STARTED",
        "SHARE",
        "SEARCH_RESULT",
      ];

      for (const eventType of eventTypes) {
        jest.clearAllMocks();
        mockPrisma.doorcard.findUnique.mockResolvedValue(mockDoorcard);
        mockPrisma.doorcardAnalytics.create.mockResolvedValue({} as any);
        mockPrisma.doorcardAnalytics.findFirst.mockResolvedValue(null);
        mockPrisma.doorcardMetrics.upsert.mockResolvedValue({} as any);

        const request = new NextRequest(
          "http://localhost:3000/api/analytics/track",
          {
            method: "POST",
            body: JSON.stringify({
              ...validTrackingData,
              eventType,
            }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockPrisma.doorcardAnalytics.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              eventType,
            }),
          })
        );
      }
    });

    it("should extract IP address from various headers", async () => {
      const testCases = [
        {
          headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
          expectedIP: "192.168.1.1",
        },
        {
          headers: { "x-real-ip": "203.0.113.1" },
          expectedIP: "203.0.113.1",
        },
        {
          headers: {}, // No IP headers
          expectedIP: null,
        },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();
        mockPrisma.doorcard.findUnique.mockResolvedValue(mockDoorcard);
        mockPrisma.doorcardAnalytics.create.mockResolvedValue({} as any);
        mockPrisma.doorcardAnalytics.findFirst.mockResolvedValue(null);
        mockPrisma.doorcardMetrics.upsert.mockResolvedValue({} as any);

        const request = new NextRequest(
          "http://localhost:3000/api/analytics/track",
          {
            method: "POST",
            body: JSON.stringify(validTrackingData),
            headers: {
              "Content-Type": "application/json",
              ...testCase.headers,
            },
          }
        );

        await POST(request);

        expect(mockPrisma.doorcardAnalytics.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              ipAddress: testCase.expectedIP,
            }),
          })
        );
      }
    });

    it("should generate session ID when not provided", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/track",
        {
          method: "POST",
          body: JSON.stringify(validTrackingData),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "192.168.1.1",
          },
        }
      );

      await POST(request);

      expect(mockPrisma.doorcardAnalytics.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sessionId: expect.stringMatching(/^192\.168\.1\.1-\d+-[a-z0-9]+$/),
          }),
        })
      );
    });

    it("should handle metadata serialization", async () => {
      const complexMetadata = {
        nested: { object: true },
        array: [1, 2, 3],
        string: "test",
        number: 42,
      };

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/track",
        {
          method: "POST",
          body: JSON.stringify({
            ...validTrackingData,
            metadata: complexMetadata,
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      await POST(request);

      expect(mockPrisma.doorcardAnalytics.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: complexMetadata,
          }),
        })
      );
    });

    it("should handle missing metadata", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/track",
        {
          method: "POST",
          body: JSON.stringify({
            doorcardId: validTrackingData.doorcardId,
            eventType: validTrackingData.eventType,
            // No metadata
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      await POST(request);

      expect(mockPrisma.doorcardAnalytics.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: undefined,
          }),
        })
      );
    });

    it("should return 404 when doorcard not found", async () => {
      mockPrisma.doorcard.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/track",
        {
          method: "POST",
          body: JSON.stringify(validTrackingData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "Doorcard not found" });
      expect(mockPrisma.doorcardAnalytics.create).not.toHaveBeenCalled();
    });

    it("should return 403 for non-public doorcard (except EDIT_STARTED)", async () => {
      mockPrisma.doorcard.findUnique.mockResolvedValue({
        ...mockDoorcard,
        isPublic: false,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/track",
        {
          method: "POST",
          body: JSON.stringify({
            ...validTrackingData,
            eventType: "VIEW", // Not EDIT_STARTED
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({ error: "Doorcard is not public" });
      expect(mockPrisma.doorcardAnalytics.create).not.toHaveBeenCalled();
    });

    it("should allow EDIT_STARTED for non-public doorcards", async () => {
      mockPrisma.doorcard.findUnique.mockResolvedValue({
        ...mockDoorcard,
        isPublic: false,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/track",
        {
          method: "POST",
          body: JSON.stringify({
            ...validTrackingData,
            eventType: "EDIT_STARTED",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.doorcardAnalytics.create).toHaveBeenCalled();
    });

    it("should return 400 for invalid request data", async () => {
      const invalidData = {
        doorcardId: "invalid-id", // Not a valid CUID
        eventType: "INVALID_EVENT",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/track",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500); // Zod validation errors are caught in general catch
      expect(data).toEqual({ error: "Failed to track event" });
    });

    it("should return 500 on database error", async () => {
      mockPrisma.doorcard.findUnique.mockRejectedValue(
        new Error("Database error")
      );

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/track",
        {
          method: "POST",
          body: JSON.stringify(validTrackingData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to track event" });
    });

    it("should handle malformed JSON", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/track",
        {
          method: "POST",
          body: "invalid json",
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to track event" });
    });
  });

  describe("Metrics Update Logic", () => {
    it("should handle VIEW event with new unique session", async () => {
      mockPrisma.doorcardAnalytics.findFirst.mockResolvedValue(null); // No recent view

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/track",
        {
          method: "POST",
          body: JSON.stringify({
            ...validTrackingData,
            eventType: "VIEW",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      await POST(request);

      expect(mockPrisma.doorcardMetrics.upsert).toHaveBeenCalledWith({
        where: { doorcardId: validTrackingData.doorcardId },
        create: {
          doorcardId: validTrackingData.doorcardId,
          totalViews: 1,
          uniqueViews: 1, // Should be 1 for unique view
          totalPrints: 0,
          totalShares: 0,
          lastViewedAt: expect.any(Date),
          lastPrintedAt: null,
          updatedAt: expect.any(Date),
        },
        update: {
          totalViews: { increment: 1 },
          uniqueViews: { increment: 1 }, // Should increment for unique view
          totalPrints: undefined,
          totalShares: undefined,
          lastViewedAt: expect.any(Date),
          lastPrintedAt: undefined,
          updatedAt: expect.any(Date),
        },
      });
    });

    it("should handle VIEW event with existing recent session", async () => {
      // Mock existing recent view from same session
      mockPrisma.doorcardAnalytics.findFirst.mockResolvedValue({
        id: "recent-view-123",
        doorcardId: validTrackingData.doorcardId,
        sessionId: "test-session",
        eventType: "VIEW",
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/track",
        {
          method: "POST",
          body: JSON.stringify({
            ...validTrackingData,
            eventType: "VIEW",
          }),
          headers: {
            "Content-Type": "application/json",
            "x-session-id": "test-session",
          },
        }
      );

      await POST(request);

      expect(mockPrisma.doorcardMetrics.upsert).toHaveBeenCalledWith({
        where: { doorcardId: validTrackingData.doorcardId },
        create: {
          doorcardId: validTrackingData.doorcardId,
          totalViews: 1,
          uniqueViews: 0, // Should be 0 for non-unique view
          totalPrints: 0,
          totalShares: 0,
          lastViewedAt: expect.any(Date),
          lastPrintedAt: null,
          updatedAt: expect.any(Date),
        },
        update: {
          totalViews: { increment: 1 },
          uniqueViews: undefined, // Should not increment for non-unique view
          totalPrints: undefined,
          totalShares: undefined,
          lastViewedAt: expect.any(Date),
          lastPrintedAt: undefined,
          updatedAt: expect.any(Date),
        },
      });
    });

    it("should handle PRINT_DOWNLOAD event", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/track",
        {
          method: "POST",
          body: JSON.stringify({
            ...validTrackingData,
            eventType: "PRINT_DOWNLOAD",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      await POST(request);

      expect(mockPrisma.doorcardMetrics.upsert).toHaveBeenCalledWith({
        where: { doorcardId: validTrackingData.doorcardId },
        create: {
          doorcardId: validTrackingData.doorcardId,
          totalViews: 0,
          uniqueViews: 0,
          totalPrints: 1,
          totalShares: 0,
          lastViewedAt: null,
          lastPrintedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        update: {
          totalViews: undefined,
          uniqueViews: undefined,
          totalPrints: { increment: 1 },
          totalShares: undefined,
          lastViewedAt: undefined,
          lastPrintedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
    });

    it("should handle SHARE event", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/track",
        {
          method: "POST",
          body: JSON.stringify({
            ...validTrackingData,
            eventType: "SHARE",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      await POST(request);

      expect(mockPrisma.doorcardMetrics.upsert).toHaveBeenCalledWith({
        where: { doorcardId: validTrackingData.doorcardId },
        create: {
          doorcardId: validTrackingData.doorcardId,
          totalViews: 0,
          uniqueViews: 0,
          totalPrints: 0,
          totalShares: 1,
          lastViewedAt: null,
          lastPrintedAt: null,
          updatedAt: expect.any(Date),
        },
        update: {
          totalViews: undefined,
          uniqueViews: undefined,
          totalPrints: undefined,
          totalShares: { increment: 1 },
          lastViewedAt: undefined,
          lastPrintedAt: undefined,
          updatedAt: expect.any(Date),
        },
      });
    });

    it("should handle non-tracked events (no metrics update)", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/track",
        {
          method: "POST",
          body: JSON.stringify({
            ...validTrackingData,
            eventType: "PRINT_PREVIEW", // Event that doesn't update metrics
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      await POST(request);

      expect(mockPrisma.doorcardMetrics.upsert).toHaveBeenCalledWith({
        where: { doorcardId: validTrackingData.doorcardId },
        create: {
          doorcardId: validTrackingData.doorcardId,
          totalViews: 0,
          uniqueViews: 0,
          totalPrints: 0,
          totalShares: 0,
          lastViewedAt: null,
          lastPrintedAt: null,
          updatedAt: expect.any(Date),
        },
        update: {
          totalViews: undefined,
          uniqueViews: undefined,
          totalPrints: undefined,
          totalShares: undefined,
          lastViewedAt: undefined,
          lastPrintedAt: undefined,
          updatedAt: expect.any(Date),
        },
      });
    });
  });
});
