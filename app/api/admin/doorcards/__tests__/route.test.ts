import { NextRequest } from "next/server";
import { GET } from "../route";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

// Mock dependencies
jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    doorcard: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("Admin Doorcards API Route", () => {
  const adminSession = {
    user: { email: "admin@example.com" },
  };

  const adminUser = {
    role: "ADMIN",
  };

  const mockDoorcards = [
    {
      id: "doorcard-1",
      name: "Dr. John Smith",
      doorcardName: "Fall Office Hours",
      term: "FALL",
      year: 2024,
      college: "SKYLINE",
      isActive: true,
      isPublic: true,
      officeNumber: "Room 101",
      createdAt: new Date("2024-09-01T10:00:00Z"),
      User: {
        email: "john.smith@example.com",
        name: "Dr. John Smith",
        firstName: "John",
        lastName: "Smith",
      },
      _count: { Appointment: 3 },
    },
    {
      id: "doorcard-2",
      name: "Prof. Jane Doe",
      doorcardName: "Spring Classes",
      term: "SPRING",
      year: 2024,
      college: "CSM",
      isActive: false,
      isPublic: false,
      officeNumber: "Room 205",
      createdAt: new Date("2024-01-15T14:30:00Z"),
      User: {
        email: "jane.doe@example.com",
        name: "Prof. Jane Doe",
        firstName: null,
        lastName: null,
      },
      _count: { Appointment: 2 },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Suppress console.error in tests
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Default successful mocks
    mockGetServerSession.mockResolvedValue(adminSession);
    mockPrisma.user.findUnique.mockResolvedValue(adminUser);
    mockPrisma.doorcard.findMany.mockResolvedValue(mockDoorcards);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/admin/doorcards", () => {
    it("should return all doorcards for admin with default parameters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);

      expect(data[0]).toEqual({
        id: "doorcard-1",
        name: "Dr. John Smith",
        doorcardName: "Fall Office Hours",
        term: "FALL",
        year: 2024,
        college: "SKYLINE",
        isActive: true,
        isPublic: true,
        officeNumber: "Room 101",
        appointmentCount: 3,
        createdAt: "2024-09-01T10:00:00.000Z",
        user: {
          email: "john.smith@example.com",
          name: "John Smith", // firstName + lastName
        },
      });

      expect(data[1]).toEqual({
        id: "doorcard-2",
        name: "Prof. Jane Doe",
        doorcardName: "Spring Classes",
        term: "SPRING",
        year: 2024,
        college: "CSM",
        isActive: false,
        isPublic: false,
        officeNumber: "Room 205",
        appointmentCount: 2,
        createdAt: "2024-01-15T14:30:00.000Z",
        user: {
          email: "jane.doe@example.com",
          name: "Prof. Jane Doe", // Fallback to name field
        },
      });

      // Verify database query with default parameters
      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith({
        where: {},
        select: expect.objectContaining({
          id: true,
          name: true,
          doorcardName: true,
          term: true,
          year: true,
          college: true,
          isActive: true,
          isPublic: true,
          officeNumber: true,
          createdAt: true,
          User: {
            select: {
              email: true,
              name: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              Appointment: true,
            },
          },
        }),
        orderBy: [{ createdAt: "desc" }],
        take: 50, // Default limit
        skip: 0, // Default offset
      });
    });

    it("should handle pagination parameters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards?limit=10&offset=20"
      );

      await GET(request);

      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });

    it("should handle search parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards?search=john"
      );

      await GET(request);

      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: "john", mode: "insensitive" } },
              { doorcardName: { contains: "john", mode: "insensitive" } },
              {
                user: {
                  OR: [
                    { email: { contains: "john", mode: "insensitive" } },
                    { name: { contains: "john", mode: "insensitive" } },
                  ],
                },
              },
            ],
          },
        })
      );
    });

    it("should handle campus filter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards?campus=SKYLINE"
      );

      await GET(request);

      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            college: "SKYLINE",
          },
        })
      );
    });

    it("should ignore campus filter when set to 'all'", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards?campus=all"
      );

      await GET(request);

      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {}, // No campus filter
        })
      );
    });

    it("should handle term filter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards?term=FALL"
      );

      await GET(request);

      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            term: "FALL",
          },
        })
      );
    });

    it("should handle active filter - true", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards?active=true"
      );

      await GET(request);

      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
          },
        })
      );
    });

    it("should handle active filter - false", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards?active=false"
      );

      await GET(request);

      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: false,
          },
        })
      );
    });

    it("should ignore active filter for other values", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards?active=maybe"
      );

      await GET(request);

      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {}, // No active filter
        })
      );
    });

    it("should handle multiple filters combined", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards?search=john&campus=SKYLINE&term=FALL&active=true&limit=25&offset=10"
      );

      await GET(request);

      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: "john", mode: "insensitive" } },
            { doorcardName: { contains: "john", mode: "insensitive" } },
            {
              user: {
                OR: [
                  { email: { contains: "john", mode: "insensitive" } },
                  { name: { contains: "john", mode: "insensitive" } },
                ],
              },
            },
          ],
          college: "SKYLINE",
          term: "FALL",
          isActive: true,
        },
        select: expect.any(Object),
        orderBy: [{ createdAt: "desc" }],
        take: 25,
        skip: 10,
      });
    });

    it("should handle invalid pagination parameters gracefully", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards?limit=invalid&offset=notanumber"
      );

      await GET(request);

      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50, // Default limit (NaN becomes 50)
          skip: 0, // Default offset (NaN becomes 0)
        })
      );
    });

    it("should return 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("should return 401 when session has no email", async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: "123" } }); // No email

      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 403 when user is not admin", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: "FACULTY" }); // Not admin

      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({ error: "Forbidden - Admin access required" });
    });

    it("should return 403 when user role is null", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: null });

      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({ error: "Forbidden - Admin access required" });
    });

    it("should return 500 on database error", async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch doorcards" });
    });

    it("should handle empty results", async () => {
      mockPrisma.doorcard.findMany.mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("should handle doorcards without user data gracefully", async () => {
      const partialDoorcard = {
        id: "doorcard-partial",
        name: "Partial Card",
        doorcardName: "Test Card",
        term: "FALL",
        year: 2024,
        college: "SKYLINE",
        isActive: true,
        isPublic: true,
        officeNumber: "Room 999",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        User: {
          email: "test@example.com",
          name: null,
          firstName: null,
          lastName: null,
        },
        _count: { Appointment: 0 },
      };

      mockPrisma.doorcard.findMany.mockResolvedValue([partialDoorcard]);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].user.name).toBeNull(); // Should handle null name gracefully
    });

    it("should process user names correctly", async () => {
      const testDoorcards = [
        {
          ...mockDoorcards[0],
          User: {
            email: "test1@example.com",
            name: "Dr. Full Name",
            firstName: "John",
            lastName: "Smith",
          },
        },
        {
          ...mockDoorcards[1],
          User: {
            email: "test2@example.com",
            name: "Prof. Legacy Name",
            firstName: null,
            lastName: null,
          },
        },
        {
          ...mockDoorcards[0],
          id: "doorcard-3",
          User: {
            email: "test3@example.com",
            name: null,
            firstName: "Jane",
            lastName: "Doe",
          },
        },
      ];

      mockPrisma.doorcard.findMany.mockResolvedValue(testDoorcards);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data[0].user.name).toBe("John Smith"); // firstName + lastName
      expect(data[1].user.name).toBe("Prof. Legacy Name"); // Fallback to name
      expect(data[2].user.name).toBe("Jane Doe"); // firstName + lastName even when name is null
    });

    it("should handle edge cases in URL parameters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/doorcards?search=&campus=&term=&active=&limit=&offset="
      );

      await GET(request);

      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {}, // Empty parameters should result in empty where clause
          take: 50, // Default limit
          skip: 0, // Default offset
        })
      );
    });
  });
});
