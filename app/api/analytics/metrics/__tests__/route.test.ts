import { GET } from "../route";
import { prisma } from "@/lib/prisma";
import { requireAuthUserAPI } from "@/lib/require-auth-user";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    doorcard: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    doorcardAnalytics: {
      count: jest.fn(),
    },
  },
}));

jest.mock("@/lib/require-auth-user", () => ({
  requireAuthUserAPI: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRequireAuthUserAPI = requireAuthUserAPI as jest.MockedFunction<
  typeof requireAuthUserAPI
>;

describe("Analytics Metrics API Route", () => {
  const mockUser = {
    id: "user-123",
    email: "user@example.com",
    name: "Test User",
  };

  const mockDoorcards = [
    {
      id: "doorcard-1",
      name: "Dr. Test Card 1",
      isActive: true,
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      DoorcardMetrics: {
        totalViews: 100,
        uniqueViews: 80,
        totalShares: 10,
      },
      _count: { Appointment: 3 },
    },
    {
      id: "doorcard-2",
      name: "Dr. Test Card 2",
      isActive: false,
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      DoorcardMetrics: {
        totalViews: 50,
        uniqueViews: 40,
        totalShares: 5,
      },
      _count: { Appointment: 2 },
    },
    {
      id: "doorcard-3",
      name: "Dr. Test Card 3",
      isActive: true,
      updatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago (old)
      DoorcardMetrics: null, // No metrics
      _count: { Appointment: 1 },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Suppress console.error in tests
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Default successful mocks
    mockRequireAuthUserAPI.mockResolvedValue({
      user: { email: "user@example.com" },
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.doorcard.findMany.mockResolvedValue(mockDoorcards);
    mockPrisma.doorcard.count.mockResolvedValue(1); // Draft count
    mockPrisma.doorcardAnalytics.count.mockResolvedValue(15); // Recent prints
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/analytics/metrics", () => {
    it("should return comprehensive metrics for authenticated user", async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        totalDoorcards: 3,
        activeDoors: 2,
        totalDrafts: 1,
        totalViews: 150, // 100 + 50 + 0
        uniqueViews: 120, // 80 + 40 + 0
        avgViewsPerCard: 50, // 150 / 3 = 50
        recentPrints: 15,
        totalShares: 15, // 10 + 5 + 0
        engagementScore: expect.any(Number),
      });

      // Verify database queries
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "user@example.com" },
      });

      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        include: {
          DoorcardMetrics: true,
          _count: {
            select: {
              Appointment: true,
            },
          },
        },
      });

      expect(mockPrisma.doorcard.count).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
          isActive: false,
        },
      });

      expect(mockPrisma.doorcardAnalytics.count).toHaveBeenCalledWith({
        where: {
          Doorcard: {
            userId: "user-123",
          },
          eventType: "PRINT_DOWNLOAD",
          createdAt: {
            gte: expect.any(Date),
          },
        },
      });
    });

    it("should calculate engagement score correctly", async () => {
      // Test specific metrics for engagement calculation
      const testDoorcards = [
        {
          id: "card-1",
          isActive: true,
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Recent
          DoorcardMetrics: {
            totalViews: 100, // High views
            uniqueViews: 80,
            totalShares: 10,
          },
          _count: { Appointment: 3 },
        },
        {
          id: "card-2",
          isActive: true,
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Recent
          DoorcardMetrics: {
            totalViews: 100, // High views
            uniqueViews: 80,
            totalShares: 10,
          },
          _count: { Appointment: 2 },
        },
      ];

      mockPrisma.doorcard.findMany.mockResolvedValue(testDoorcards);
      mockPrisma.doorcard.count.mockResolvedValue(0); // No drafts
      mockPrisma.doorcardAnalytics.count.mockResolvedValue(8); // 4 prints per card

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);

      // avgViewsPerCard = 200/2 = 100
      expect(data.avgViewsPerCard).toBe(100);

      // Engagement calculation:
      // - View score: min((100/25) * 40, 40) = 40
      // - Print score: min((8/(2*2)) * 25, 25) = 50 -> capped at 25
      // - Active ratio: (2/2) * 20 = 20
      // - Maintenance: (2/2) * 15 = 15 (both recently updated)
      // Total: 40 + 25 + 20 + 15 = 100
      expect(data.engagementScore).toBe(100);
    });

    it("should handle user with no doorcards", async () => {
      mockPrisma.doorcard.findMany.mockResolvedValue([]);
      mockPrisma.doorcard.count.mockResolvedValue(0);
      mockPrisma.doorcardAnalytics.count.mockResolvedValue(0);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        totalDoorcards: 0,
        activeDoors: 0,
        totalDrafts: 0,
        totalViews: 0,
        uniqueViews: 0,
        avgViewsPerCard: 0,
        recentPrints: 0,
        totalShares: 0,
        engagementScore: 0,
      });
    });

    it("should handle doorcards without metrics", async () => {
      const doorcardsWithoutMetrics = [
        {
          id: "card-1",
          isActive: true,
          updatedAt: new Date(),
          DoorcardMetrics: null,
          _count: { Appointment: 1 },
        },
        {
          id: "card-2",
          isActive: false,
          updatedAt: new Date(),
          DoorcardMetrics: undefined,
          _count: { Appointment: 0 },
        },
      ];

      mockPrisma.doorcard.findMany.mockResolvedValue(doorcardsWithoutMetrics);
      mockPrisma.doorcard.count.mockResolvedValue(1);
      mockPrisma.doorcardAnalytics.count.mockResolvedValue(0);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        totalDoorcards: 2,
        activeDoors: 1,
        totalDrafts: 1,
        totalViews: 0, // No metrics
        uniqueViews: 0,
        avgViewsPerCard: 0,
        recentPrints: 0,
        totalShares: 0,
        engagementScore: expect.any(Number), // Will have some score from active ratio
      });

      // Should still calculate engagement based on active ratio and maintenance
      expect(data.engagementScore).toBeGreaterThan(0);
    });

    it("should calculate recent maintenance score correctly", async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const testDoorcards = [
        {
          id: "recent-card",
          isActive: true,
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago - recent
          DoorcardMetrics: null,
          _count: { Appointment: 1 },
        },
        {
          id: "old-card",
          isActive: true,
          updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago - old
          DoorcardMetrics: null,
          _count: { Appointment: 1 },
        },
      ];

      mockPrisma.doorcard.findMany.mockResolvedValue(testDoorcards);
      mockPrisma.doorcard.count.mockResolvedValue(0);
      mockPrisma.doorcardAnalytics.count.mockResolvedValue(0);

      const response = await GET();
      const data = await response.json();

      // Engagement should include maintenance score: (1/2) * 15 = 7.5
      // Plus active ratio: (2/2) * 20 = 20
      // Total: ~28 (rounded)
      expect(data.engagementScore).toBeCloseTo(28, 0);
    });

    it("should handle edge cases in engagement calculation", async () => {
      // Test maximum engagement scores
      const highEngagementCards = [
        {
          id: "high-card",
          isActive: true,
          updatedAt: new Date(), // Very recent
          DoorcardMetrics: {
            totalViews: 1000, // Very high views (25 * 40 = 1000 for max score)
            uniqueViews: 800,
            totalShares: 50,
          },
          _count: { Appointment: 5 },
        },
      ];

      mockPrisma.doorcard.findMany.mockResolvedValue(highEngagementCards);
      mockPrisma.doorcard.count.mockResolvedValue(0);
      mockPrisma.doorcardAnalytics.count.mockResolvedValue(10); // High print count

      const response = await GET();
      const data = await response.json();

      expect(data.avgViewsPerCard).toBe(1000);
      expect(data.engagementScore).toBe(100); // Should be capped at reasonable maximum
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
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("should return 401 when session has no email", async () => {
      mockRequireAuthUserAPI.mockResolvedValue({ user: { id: "123" } }); // No email

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 when user is not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "User not found" });
    });

    it("should return 500 on database error", async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error("Database error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch metrics" });
    });

    it("should handle partial database errors gracefully", async () => {
      mockPrisma.doorcard.findMany.mockResolvedValue(mockDoorcards);
      mockPrisma.doorcard.count.mockRejectedValue(new Error("Count error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch metrics" });
    });

    it("should correctly filter active vs inactive doorcards", async () => {
      const mixedDoorcards = [
        {
          id: "1",
          isActive: true,
          updatedAt: new Date(),
          DoorcardMetrics: null,
          _count: { Appointment: 1 },
        },
        {
          id: "2",
          isActive: false,
          updatedAt: new Date(),
          DoorcardMetrics: null,
          _count: { Appointment: 1 },
        },
        {
          id: "3",
          isActive: true,
          updatedAt: new Date(),
          DoorcardMetrics: null,
          _count: { Appointment: 1 },
        },
        {
          id: "4",
          isActive: false,
          updatedAt: new Date(),
          DoorcardMetrics: null,
          _count: { Appointment: 1 },
        },
        {
          id: "5",
          isActive: true,
          updatedAt: new Date(),
          DoorcardMetrics: null,
          _count: { Appointment: 1 },
        },
      ];

      mockPrisma.doorcard.findMany.mockResolvedValue(mixedDoorcards);
      mockPrisma.doorcard.count.mockResolvedValue(2); // 2 inactive
      mockPrisma.doorcardAnalytics.count.mockResolvedValue(0);

      const response = await GET();
      const data = await response.json();

      expect(data.totalDoorcards).toBe(5);
      expect(data.activeDoors).toBe(3);
      expect(data.totalDrafts).toBe(2);

      // Active ratio: 3/5 = 0.6, so active score = 0.6 * 20 = 12
      // Maintenance: all recently updated, so 5/5 * 15 = 15
      // Total engagement: 0 + 0 + 12 + 15 = 27
      expect(data.engagementScore).toBe(27);
    });

    it("should handle date calculations for recent analytics correctly", async () => {
      // Verify that the 30-day cutoff is calculated correctly
      await GET();

      expect(mockPrisma.doorcardAnalytics.count).toHaveBeenCalledWith({
        where: {
          Doorcard: {
            userId: "user-123",
          },
          eventType: "PRINT_DOWNLOAD",
          createdAt: {
            gte: expect.any(Date),
          },
        },
      });

      // Check that the date is approximately 30 days ago
      const callArgs = mockPrisma.doorcardAnalytics.count.mock.calls[0][0];
      const thirtyDaysAgo = callArgs.where.createdAt.gte;
      const now = new Date();
      const diffInDays =
        (now.getTime() - thirtyDaysAgo.getTime()) / (1000 * 60 * 60 * 24);

      expect(diffInDays).toBeCloseTo(30, 1); // Within 1 day tolerance
    });
  });
});
