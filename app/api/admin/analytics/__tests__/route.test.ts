import { GET } from "../route";
import { prisma } from "@/lib/prisma";
import { requireAuthUserAPI } from "@/lib/require-auth-user";

// Mock dependencies
jest.mock("@/lib/prisma");

jest.mock("@/lib/require-auth-user", () => ({
  requireAuthUserAPI: jest.fn(),
}));

// Create properly typed mocks
const mockUser = {
  findUnique: jest.fn(),
};
const mockDoorcardAnalytics = {
  groupBy: jest.fn(),
};
const mockDoorcardMetrics = {
  aggregate: jest.fn(),
};
const mockDoorcard = {
  findMany: jest.fn(),
};

// Apply mocks to prisma
(prisma.user as any) = mockUser;
(prisma.doorcardAnalytics as any) = mockDoorcardAnalytics;
(prisma.doorcardMetrics as any) = mockDoorcardMetrics;
(prisma.doorcard as any) = mockDoorcard;
const mockRequireAuthUserAPI = requireAuthUserAPI as jest.MockedFunction<
  typeof requireAuthUserAPI
>;

describe("Admin Analytics API Route", () => {
  const mockAdminUser = {
    id: "admin-123",
    email: "admin@example.com",
    name: "Admin User",
    role: "ADMIN" as const,
    college: "SKYLINE" as const,
    firstName: "Admin",
    lastName: "User",
    title: null,
    displayFormat: "FULL_NAME" as const,
    username: "adminuser",
    password: null,
    website: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    pronouns: null,
    emailVerified: null,
    image: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Suppress console.error in tests
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/admin/analytics", () => {
    it("should return comprehensive analytics data for authenticated admin", async () => {
      // Mock successful auth
      mockRequireAuthUserAPI.mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      mockUser.findUnique.mockResolvedValue({ role: "ADMIN" });

      // Mock analytics data
      const mockAnalyticsGroupBy = [
        { eventType: "VIEW", _count: { eventType: 1500 } },
        { eventType: "PRINT", _count: { eventType: 250 } },
        { eventType: "SHARE", _count: { eventType: 75 } },
      ];

      const mockMetricsAggregate = {
        _sum: {
          totalViews: 2000,
          uniqueViews: 1200,
          totalPrints: 300,
          totalShares: 100,
        },
      };

      const mockRecentAnalytics = [
        { eventType: "VIEW", _count: { eventType: 800 } },
        { eventType: "PRINT", _count: { eventType: 120 } },
      ];

      const mockTopDoorcards = [
        {
          id: "doorcard-1",
          doorcardName: "Dr. Smith Office Hours",
          college: "SKYLINE" as const,
          User: {
            name: "Dr. John Smith",
            firstName: "John",
            lastName: "Smith",
          },
          DoorcardMetrics: {
            totalViews: 500,
            totalPrints: 50,
            totalShares: 15,
            lastViewedAt: new Date("2024-01-15T10:00:00Z"),
          },
        },
        {
          id: "doorcard-2",
          doorcardName: "Prof. Johnson Schedule",
          college: "CSM" as const,
          User: {
            name: "Prof. Mary Johnson",
            firstName: null,
            lastName: null,
          },
          DoorcardMetrics: {
            totalViews: 300,
            totalPrints: 25,
            totalShares: 8,
            lastViewedAt: new Date("2024-01-14T15:30:00Z"),
          },
        },
      ];

      mockDoorcardAnalytics.groupBy
        .mockResolvedValueOnce(mockAnalyticsGroupBy as any) // First call: total analytics
        .mockResolvedValueOnce(mockRecentAnalytics as any); // Second call: recent analytics

      mockDoorcardMetrics.aggregate.mockResolvedValue(
        mockMetricsAggregate as any
      );
      mockDoorcard.findMany.mockResolvedValue(mockTopDoorcards as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("analytics");
      expect(data).toHaveProperty("doorcards");
      expect(data).toHaveProperty("systemStats");

      // Verify analytics data
      expect(data.analytics).toEqual({
        totalViews: 2000,
        uniqueViews: 1200,
        totalPrints: 300,
        totalShares: 100,
        engagementScore: expect.any(Number),
        recentActivity: [],
      });

      // Verify doorcard analytics
      expect(data.doorcards).toHaveLength(2);
      expect(data.doorcards[0]).toEqual({
        doorcardId: "doorcard-1",
        doorcardName: "Dr. Smith Office Hours",
        facultyName: "John Smith",
        totalViews: 500,
        totalPrints: 50,
        totalShares: 15,
        lastViewedAt: "2024-01-15T10:00:00.000Z",
        college: "SKYLINE",
      });

      // Verify system stats
      expect(data.systemStats).toEqual({
        totalEvents: 1825, // 1500 + 250 + 75
        recentEvents: 920, // 800 + 120
        eventBreakdown: {
          VIEW: 1500,
          PRINT: 250,
          SHARE: 75,
        },
      });
    });

    it("should calculate engagement score correctly", async () => {
      mockRequireAuthUserAPI.mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      mockUser.findUnique.mockResolvedValue({ role: "ADMIN" });

      // Test different engagement scenarios
      const testCases = [
        {
          metrics: {
            _sum: {
              totalViews: 1000,
              uniqueViews: 800,
              totalPrints: 100,
              totalShares: 50,
            },
          },
          expectedScore: 98, // 40 + 30 + 20 + 8
        },
        {
          metrics: {
            _sum: {
              totalViews: 0,
              uniqueViews: 0,
              totalPrints: 0,
              totalShares: 0,
            },
          },
          expectedScore: 0,
        },
        {
          metrics: {
            _sum: {
              totalViews: 5000, // Over threshold, should cap at 40
              uniqueViews: 2500,
              totalPrints: 500, // Over threshold, should cap at 30
              totalShares: 200, // Over threshold, should cap at 20
            },
          },
          expectedScore: 95, // 40 + 30 + 20 + 5 (50% unique ratio)
        },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();
        mockRequireAuthUserAPI.mockResolvedValue({
          user: { email: "admin@example.com" },
        });
        mockUser.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDoorcardAnalytics.groupBy.mockResolvedValue([]);
        mockDoorcardMetrics.aggregate.mockResolvedValue(
          testCase.metrics as any
        );
        mockDoorcard.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(data.analytics.engagementScore).toBe(testCase.expectedScore);
      }
    });

    it("should handle faculty name formatting correctly", async () => {
      mockRequireAuthUserAPI.mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      mockUser.findUnique.mockResolvedValue({ role: "ADMIN" });
      mockDoorcardAnalytics.groupBy.mockResolvedValue([]);
      mockDoorcardMetrics.aggregate.mockResolvedValue({
        _sum: { totalViews: 0, uniqueViews: 0, totalPrints: 0, totalShares: 0 },
      } as any);

      const testDoorcards = [
        {
          id: "card-1",
          doorcardName: "Test Card 1",
          college: "SKYLINE" as const,
          User: {
            name: "Dr. John Smith",
            firstName: "John",
            lastName: "Smith",
          },
          DoorcardMetrics: { totalViews: 100, totalPrints: 10, totalShares: 5 },
        },
        {
          id: "card-2",
          doorcardName: "Test Card 2",
          college: "CSM" as const,
          User: {
            name: "Prof. Legacy Name",
            firstName: null,
            lastName: null,
          },
          DoorcardMetrics: { totalViews: 100, totalPrints: 10, totalShares: 5 },
        },
        {
          id: "card-3",
          doorcardName: "Test Card 3",
          college: "CANADA" as const,
          User: {
            name: null,
            firstName: null,
            lastName: null,
          },
          DoorcardMetrics: { totalViews: 100, totalPrints: 10, totalShares: 5 },
        },
      ];

      mockDoorcard.findMany.mockResolvedValue(testDoorcards as any);

      const response = await GET();
      const data = await response.json();

      expect(data.doorcards[0].facultyName).toBe("John Smith");
      expect(data.doorcards[1].facultyName).toBe("Prof. Legacy Name");
      expect(data.doorcards[2].facultyName).toBe("Unknown");
    });

    it("should handle null metrics data gracefully", async () => {
      mockRequireAuthUserAPI.mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      mockUser.findUnique.mockResolvedValue({ role: "ADMIN" });
      mockDoorcardAnalytics.groupBy.mockResolvedValue([]);
      mockDoorcardMetrics.aggregate.mockResolvedValue({
        _sum: {
          totalViews: null,
          uniqueViews: null,
          totalPrints: null,
          totalShares: null,
        },
      } as any);
      mockDoorcard.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analytics).toEqual({
        totalViews: 0,
        uniqueViews: 0,
        totalPrints: 0,
        totalShares: 0,
        engagementScore: 0,
        recentActivity: [],
      });
    });

    it("should handle doorcards without metrics", async () => {
      mockRequireAuthUserAPI.mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      mockUser.findUnique.mockResolvedValue({ role: "ADMIN" });
      mockDoorcardAnalytics.groupBy.mockResolvedValue([]);
      mockDoorcardMetrics.aggregate.mockResolvedValue({
        _sum: { totalViews: 0, uniqueViews: 0, totalPrints: 0, totalShares: 0 },
      } as any);

      const doorcardWithoutMetrics = [
        {
          id: "card-1",
          doorcardName: "No Metrics Card",
          college: "SKYLINE" as const,
          User: {
            name: "Test User",
            firstName: "Test",
            lastName: "User",
          },
          DoorcardMetrics: null, // No metrics
        },
      ];

      mockDoorcard.findMany.mockResolvedValue(doorcardWithoutMetrics as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.doorcards[0]).toEqual({
        doorcardId: "card-1",
        doorcardName: "No Metrics Card",
        facultyName: "Test User",
        totalViews: 0,
        totalPrints: 0,
        totalShares: 0,
        lastViewedAt: undefined,
        college: "SKYLINE",
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      mockRequireAuthUserAPI.mockResolvedValue({
        error: "Unauthorized",
        status: 401,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
      expect(mockUser.findUnique).not.toHaveBeenCalled();
    });

    it("should return 401 when user session has no email", async () => {
      mockRequireAuthUserAPI.mockResolvedValue({ user: { id: "123" } }); // No email

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 403 when user is not admin", async () => {
      mockRequireAuthUserAPI.mockResolvedValue({
        user: { email: "faculty@example.com" },
      });
      mockUser.findUnique.mockResolvedValue({ role: "FACULTY" });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({ error: "Unauthorized: Admin access required" });
    });

    it("should return 404 when user is not found", async () => {
      mockRequireAuthUserAPI.mockResolvedValue({
        user: { email: "nonexistent@example.com" },
      });
      mockUser.findUnique.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "User not found" });
    });

    it("should return 500 on database error", async () => {
      mockRequireAuthUserAPI.mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      mockUser.findUnique.mockResolvedValue({ role: "ADMIN" });
      mockDoorcardAnalytics.groupBy.mockRejectedValue(
        new Error("Database error")
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch analytics" });
    });

    it("should verify database queries are called with correct parameters", async () => {
      mockRequireAuthUserAPI.mockResolvedValue({
        user: { email: "admin@example.com" },
      });
      mockUser.findUnique.mockResolvedValue({ role: "ADMIN" });
      mockDoorcardAnalytics.groupBy.mockResolvedValue([]);
      mockDoorcardMetrics.aggregate.mockResolvedValue({
        _sum: { totalViews: 0, uniqueViews: 0, totalPrints: 0, totalShares: 0 },
      } as any);
      mockDoorcard.findMany.mockResolvedValue([]);

      await GET();

      // Verify user lookup
      expect(mockUser.findUnique).toHaveBeenCalledWith({
        where: { email: "admin@example.com" },
        select: { role: true },
      });

      // Verify analytics groupBy calls
      expect(mockDoorcardAnalytics.groupBy).toHaveBeenCalledTimes(2);

      // First call: total analytics
      expect(mockDoorcardAnalytics.groupBy).toHaveBeenNthCalledWith(1, {
        by: ["eventType"],
        _count: {
          eventType: true,
        },
      });

      // Second call: recent analytics (last 30 days)
      expect(mockDoorcardAnalytics.groupBy).toHaveBeenNthCalledWith(2, {
        by: ["eventType"],
        where: {
          createdAt: {
            gte: expect.any(Date),
          },
        },
        _count: {
          eventType: true,
        },
      });

      // Verify metrics aggregate
      expect(mockDoorcardMetrics.aggregate).toHaveBeenCalledWith({
        _sum: {
          totalViews: true,
          uniqueViews: true,
          totalPrints: true,
          totalShares: true,
        },
      });

      // Verify top doorcards query
      expect(mockDoorcard.findMany).toHaveBeenCalledWith({
        include: {
          DoorcardMetrics: true,
          User: {
            select: {
              name: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        where: {
          DoorcardMetrics: {
            totalViews: {
              gt: 0,
            },
          },
        },
        orderBy: {
          DoorcardMetrics: {
            totalViews: "desc",
          },
        },
        take: 20,
      });
    });
  });
});
