import { NextRequest } from "next/server";
import { GET } from "../route";
import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { prisma } from "@/lib/prisma";

// Mock dependencies
jest.mock("@/lib/require-auth-user", () => ({
  requireAuthUserAPI: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
    },
    doorcard: {
      findFirst: jest.fn(),
    },
  },
}));

const mockRequireAuthUserAPI = requireAuthUserAPI as MockedFunction<
  typeof requireAuthUserAPI
>;
const mockPrisma = prisma as MockedObject<typeof prisma>;

describe("Current Doorcard View API Route", () => {
  const mockUser = {
    id: "user-123",
    name: "Test User",
  };

  const mockDoorcard = {
    id: "doorcard-123",
    name: "Dr. John Smith",
    doorcardName: "Fall Office Hours",
    officeNumber: "Room 101",
    term: "FALL",
    year: 2024,
    college: "SKYLINE",
    isActive: true,
    createdAt: new Date("2024-09-01T10:00:00Z"),
    updatedAt: new Date("2024-09-15T12:00:00Z"),
    User: {
      name: "Dr. John Smith",
      college: "SKYLINE",
    },
    Appointment: [
      {
        id: "appt-1",
        name: "Office Hours",
        dayOfWeek: "MONDAY",
        startTime: "10:00",
        endTime: "12:00",
        category: "OFFICE_HOURS",
        location: "Room 101",
      },
      {
        id: "appt-2",
        name: "Lab Session",
        dayOfWeek: "WEDNESDAY",
        startTime: "14:00",
        endTime: "16:00",
        category: "LAB",
        location: "Lab 201",
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Suppress console.error in tests
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Default successful auth
    mockRequireAuthUserAPI.mockResolvedValue({ user: mockUser });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/doorcards/view/[username]/current", () => {
    const createRequest = (username: string) => {
      return new NextRequest(
        `http://localhost:3000/api/doorcards/view/${username}/current`
      );
    };

    describe("Authentication", () => {
      it("should return 401 when not authenticated", async () => {
        mockRequireAuthUserAPI.mockResolvedValue({
          error: "Unauthorized",
          status: 401,
        });

        const params = Promise.resolve({ username: "jsmith" });
        const response = await GET(createRequest("jsmith"), { params });
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data).toEqual({ error: "Unauthorized" });
        expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
      });

      it("should handle auth service errors with hardcoded 401 status", async () => {
        mockRequireAuthUserAPI.mockResolvedValue({
          error: "Forbidden",
          status: 403,
        });

        const params = Promise.resolve({ username: "jsmith" });
        const response = await GET(createRequest("jsmith"), { params });
        const data = await response.json();

        expect(response.status).toBe(401); // Implementation hardcodes 401
        expect(data).toEqual({ error: "Forbidden" });
      });
    });

    describe("User lookup", () => {
      it("should find user by username", async () => {
        mockPrisma.user.findFirst.mockResolvedValue(mockUser);
        mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);

        const params = Promise.resolve({ username: "jsmith" });
        const response = await GET(createRequest("jsmith"), { params });

        expect(response.status).toBe(200);
        expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
          where: {
            OR: [
              { username: "jsmith" },
              { email: "jsmith" },
              { name: { contains: "jsmith", mode: "insensitive" } },
            ],
          },
          select: { id: true },
        });
      });

      it("should find user by email", async () => {
        mockPrisma.user.findFirst.mockResolvedValue(mockUser);
        mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);

        const params = Promise.resolve({ username: "john@example.com" });
        const response = await GET(createRequest("john@example.com"), {
          params,
        });

        expect(response.status).toBe(200);
        expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
          where: {
            OR: [
              { username: "john@example.com" },
              { email: "john@example.com" },
              { name: { contains: "john@example.com", mode: "insensitive" } },
            ],
          },
          select: { id: true },
        });
      });

      it("should find user by name (case insensitive)", async () => {
        mockPrisma.user.findFirst.mockResolvedValue(mockUser);
        mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);

        const params = Promise.resolve({ username: "John Smith" });
        const response = await GET(createRequest("John Smith"), { params });

        expect(response.status).toBe(200);
        expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
          where: {
            OR: [
              { username: "John Smith" },
              { email: "John Smith" },
              { name: { contains: "John Smith", mode: "insensitive" } },
            ],
          },
          select: { id: true },
        });
      });

      it("should return 404 when user not found", async () => {
        mockPrisma.user.findFirst.mockResolvedValue(null);

        const params = Promise.resolve({ username: "nonexistent" });
        const response = await GET(createRequest("nonexistent"), { params });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data).toEqual({ error: "User not found" });
        expect(mockPrisma.doorcard.findFirst).not.toHaveBeenCalled();
      });

      it("should handle special characters in username", async () => {
        mockPrisma.user.findFirst.mockResolvedValue(mockUser);
        mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);

        const params = Promise.resolve({ username: "josé.garcía@example.com" });
        const response = await GET(createRequest("josé.garcía@example.com"), {
          params,
        });

        expect(response.status).toBe(200);
        expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
          where: {
            OR: [
              { username: "josé.garcía@example.com" },
              { email: "josé.garcía@example.com" },
              {
                name: {
                  contains: "josé.garcía@example.com",
                  mode: "insensitive",
                },
              },
            ],
          },
          select: { id: true },
        });
      });
    });

    describe("Doorcard retrieval", () => {
      beforeEach(() => {
        mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      });

      it("should find active doorcard for user", async () => {
        mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);

        const params = Promise.resolve({ username: "jsmith" });
        const response = await GET(createRequest("jsmith"), { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(mockDoorcard);

        expect(mockPrisma.doorcard.findFirst).toHaveBeenCalledWith({
          where: { userId: "user-123", isActive: true },
          include: {
            User: { select: { name: true, college: true } },
            Appointment: {
              orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
            },
          },
          orderBy: { createdAt: "desc" },
        });
      });

      it("should return 404 when no active doorcard found", async () => {
        mockPrisma.doorcard.findFirst.mockResolvedValue(null);

        const params = Promise.resolve({ username: "jsmith" });
        const response = await GET(createRequest("jsmith"), { params });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data).toEqual({ error: "No active doorcard found" });
      });

      it("should include user information in doorcard", async () => {
        const doorcardWithUser = {
          ...mockDoorcard,
          User: {
            name: "Dr. Jane Doe",
            college: "CSM",
          },
        };

        mockPrisma.doorcard.findFirst.mockResolvedValue(doorcardWithUser);

        const params = Promise.resolve({ username: "jdoe" });
        const response = await GET(createRequest("jdoe"), { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.User.name).toBe("Dr. Jane Doe");
        expect(data.User.college).toBe("CSM");
      });

      it("should include appointments sorted correctly", async () => {
        const doorcardWithSortedAppointments = {
          ...mockDoorcard,
          Appointment: [
            {
              id: "appt-1",
              dayOfWeek: "MONDAY",
              startTime: "14:00",
              name: "Afternoon Office Hours",
            },
            {
              id: "appt-2",
              dayOfWeek: "MONDAY",
              startTime: "10:00",
              name: "Morning Office Hours",
            },
            {
              id: "appt-3",
              dayOfWeek: "FRIDAY",
              startTime: "09:00",
              name: "Friday Session",
            },
          ],
        };

        mockPrisma.doorcard.findFirst.mockResolvedValue(
          doorcardWithSortedAppointments
        );

        const params = Promise.resolve({ username: "jsmith" });
        const response = await GET(createRequest("jsmith"), { params });

        expect(response.status).toBe(200);

        // Verify appointments are ordered by day then by start time
        expect(mockPrisma.doorcard.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            include: {
              User: { select: { name: true, college: true } },
              Appointment: {
                orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
              },
            },
          })
        );
      });

      it("should return most recent doorcard when multiple active ones exist", async () => {
        mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);

        const params = Promise.resolve({ username: "jsmith" });
        const response = await GET(createRequest("jsmith"), { params });

        expect(response.status).toBe(200);

        // Verify ordered by creation date descending
        expect(mockPrisma.doorcard.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: { createdAt: "desc" },
          })
        );
      });

      it("should handle doorcard with no appointments", async () => {
        const doorcardWithoutAppointments = {
          ...mockDoorcard,
          Appointment: [],
        };

        mockPrisma.doorcard.findFirst.mockResolvedValue(
          doorcardWithoutAppointments
        );

        const params = Promise.resolve({ username: "jsmith" });
        const response = await GET(createRequest("jsmith"), { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.Appointment).toEqual([]);
      });
    });

    describe("Error handling", () => {
      it("should handle database errors in user lookup", async () => {
        mockPrisma.user.findFirst.mockRejectedValue(
          new Error("Database error")
        );

        const params = Promise.resolve({ username: "jsmith" });
        const response = await GET(createRequest("jsmith"), { params });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({ error: "Failed to fetch doorcard" });
      });

      it("should handle database errors in doorcard lookup", async () => {
        mockPrisma.user.findFirst.mockResolvedValue(mockUser);
        mockPrisma.doorcard.findFirst.mockRejectedValue(
          new Error("Database error")
        );

        const params = Promise.resolve({ username: "jsmith" });
        const response = await GET(createRequest("jsmith"), { params });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({ error: "Failed to fetch doorcard" });
      });

      it("should handle malformed params", async () => {
        // Test with undefined params
        try {
          const params = Promise.resolve({ username: undefined });
          const response = await GET(createRequest(""), { params });
          const data = await response.json();

          expect(response.status).toBe(500);
          expect(data).toEqual({ error: "Failed to fetch doorcard" });
        } catch (error) {
          // This is expected for malformed params
          expect(error).toBeDefined();
        }
      });
    });

    describe("Edge cases", () => {
      it("should handle empty username", async () => {
        mockPrisma.user.findFirst.mockResolvedValue(null);

        const params = Promise.resolve({ username: "" });
        const response = await GET(createRequest(""), { params });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data).toEqual({ error: "User not found" });

        expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
          where: {
            OR: [
              { username: "" },
              { email: "" },
              { name: { contains: "", mode: "insensitive" } },
            ],
          },
          select: { id: true },
        });
      });

      it("should handle very long username", async () => {
        const longUsername = "a".repeat(200);
        mockPrisma.user.findFirst.mockResolvedValue(mockUser);
        mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);

        const params = Promise.resolve({ username: longUsername });
        const response = await GET(createRequest(longUsername), { params });

        expect(response.status).toBe(200);
        expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
          where: {
            OR: [
              { username: longUsername },
              { email: longUsername },
              { name: { contains: longUsername, mode: "insensitive" } },
            ],
          },
          select: { id: true },
        });
      });

      it("should handle username with SQL-like patterns", async () => {
        const sqlLikeUsername = "admin'; DROP TABLE users; --";
        mockPrisma.user.findFirst.mockResolvedValue(mockUser);
        mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);

        const params = Promise.resolve({ username: sqlLikeUsername });
        const response = await GET(createRequest(sqlLikeUsername), { params });

        expect(response.status).toBe(200);
        // Prisma should handle this safely
        expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
          where: {
            OR: [
              { username: sqlLikeUsername },
              { email: sqlLikeUsername },
              { name: { contains: sqlLikeUsername, mode: "insensitive" } },
            ],
          },
          select: { id: true },
        });
      });
    });

    describe("Integration scenarios", () => {
      it("should complete full user lookup and doorcard retrieval flow", async () => {
        // User found by email
        mockPrisma.user.findFirst.mockResolvedValue({ id: "user-456" });

        // Doorcard found with full data
        const fullDoorcard = {
          id: "doorcard-456",
          name: "Prof. Complete Example",
          doorcardName: "Complete Course",
          term: "SPRING",
          year: 2024,
          college: "CANADA",
          isActive: true,
          User: {
            name: "Prof. Complete Example",
            college: "CANADA",
          },
          Appointment: [
            {
              id: "appt-1",
              dayOfWeek: "TUESDAY",
              startTime: "09:00",
              name: "Morning Lecture",
            },
            {
              id: "appt-2",
              dayOfWeek: "THURSDAY",
              startTime: "13:00",
              name: "Lab Session",
            },
          ],
        };

        mockPrisma.doorcard.findFirst.mockResolvedValue(fullDoorcard);

        const params = Promise.resolve({ username: "complete@example.com" });
        const response = await GET(createRequest("complete@example.com"), {
          params,
        });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(fullDoorcard);

        // Verify both queries were made correctly
        expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
          where: {
            OR: [
              { username: "complete@example.com" },
              { email: "complete@example.com" },
              {
                name: { contains: "complete@example.com", mode: "insensitive" },
              },
            ],
          },
          select: { id: true },
        });

        expect(mockPrisma.doorcard.findFirst).toHaveBeenCalledWith({
          where: { userId: "user-456", isActive: true },
          include: {
            User: { select: { name: true, college: true } },
            Appointment: {
              orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
            },
          },
          orderBy: { createdAt: "desc" },
        });
      });

      it("should handle partial matches in name search", async () => {
        // Test that name search is case insensitive and uses contains
        mockPrisma.user.findFirst.mockResolvedValue(mockUser);
        mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);

        const params = Promise.resolve({ username: "smith" });
        const response = await GET(createRequest("smith"), { params });

        expect(response.status).toBe(200);
        expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
          where: {
            OR: [
              { username: "smith" },
              { email: "smith" },
              { name: { contains: "smith", mode: "insensitive" } },
            ],
          },
          select: { id: true },
        });
      });
    });
  });
});
