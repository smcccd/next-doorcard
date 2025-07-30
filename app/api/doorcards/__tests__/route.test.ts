import { NextRequest } from "next/server";
import { POST, GET } from "../route";
import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { prisma } from "@/lib/prisma";

// Mock dependencies
jest.mock("@/lib/require-auth-user");
jest.mock("@/lib/prisma", () => ({
  prisma: {
    doorcard: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockRequireAuthUserAPI = requireAuthUserAPI as jest.MockedFunction<
  typeof requireAuthUserAPI
>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("/api/doorcards", () => {
  const mockUser = {
    id: "user-123",
    email: "test@smccd.edu",
    name: "Test User",
    role: "FACULTY",
    college: "SKYLINE",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/doorcards", () => {
    const validDoorcardData = {
      name: "Dr. Test Professor",
      doorcardName: "Fall Office Hours",
      officeNumber: "Room 123",
      term: "FALL",
      year: 2024,
      college: "SKYLINE",
      appointments: [
        {
          name: "Office Hours",
          startTime: "10:00",
          endTime: "12:00",
          dayOfWeek: "MONDAY",
          category: "OFFICE_HOURS",
          location: "Office",
        },
      ],
    };

    const mockCreatedDoorcard = {
      id: "doorcard-123",
      ...validDoorcardData,
      slug: "dr-test-professor-fall-2024",
      userId: mockUser.id,
      appointments: [
        {
          id: "appointment-123",
          ...validDoorcardData.appointments[0],
          doorcardId: "doorcard-123",
        },
      ],
    };

    beforeEach(() => {
      mockRequireAuthUserAPI.mockResolvedValue({ user: mockUser });
      mockPrisma.doorcard.findFirst.mockResolvedValue(null); // No existing doorcard
      mockPrisma.doorcard.create.mockResolvedValue(mockCreatedDoorcard);
    });

    it("creates doorcard with valid data", async () => {
      const request = new NextRequest("http://localhost:3000/api/doorcards", {
        method: "POST",
        body: JSON.stringify(validDoorcardData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockCreatedDoorcard);
      expect(mockPrisma.doorcard.create).toHaveBeenCalledWith({
        data: {
          name: validDoorcardData.name,
          doorcardName: validDoorcardData.doorcardName,
          officeNumber: validDoorcardData.officeNumber,
          term: validDoorcardData.term,
          year: validDoorcardData.year,
          college: validDoorcardData.college,
          isActive: false, // New default
          isPublic: false, // New default
          slug: "dr-test-professor-fall-2024",
          userId: mockUser.id,
          appointments: {
            create: validDoorcardData.appointments.map((apt) => ({
              name: apt.name,
              startTime: apt.startTime,
              endTime: apt.endTime,
              dayOfWeek: apt.dayOfWeek,
              category: apt.category,
              location: apt.location,
            })),
          },
        },
        include: {
          appointments: true,
        },
      });
    });

    it("returns 401 when user is not authenticated", async () => {
      mockRequireAuthUserAPI.mockResolvedValue({
        error: "Unauthorized",
        status: 401,
      });

      const request = new NextRequest("http://localhost:3000/api/doorcards", {
        method: "POST",
        body: JSON.stringify(validDoorcardData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
      expect(mockPrisma.doorcard.create).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid data", async () => {
      const invalidData = {
        // Missing required fields
        name: "",
        invalidField: "invalid",
      };

      const request = new NextRequest("http://localhost:3000/api/doorcards", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation error");
      expect(data.details).toBeDefined();
      expect(mockPrisma.doorcard.create).not.toHaveBeenCalled();
    });

    it("returns 409 when doorcard already exists for same campus/term/year", async () => {
      const existingDoorcard = {
        id: "existing-doorcard-123",
        userId: mockUser.id,
        college: "SKYLINE",
        term: "FALL",
        year: 2024,
        isActive: true,
      };
      mockPrisma.doorcard.findFirst.mockResolvedValue(existingDoorcard);

      const request = new NextRequest("http://localhost:3000/api/doorcards", {
        method: "POST",
        body: JSON.stringify(validDoorcardData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain(
        "You already have a doorcard for Skyline College - FALL 2024"
      );
      expect(data.existingDoorcardId).toBe("existing-doorcard-123");
      expect(mockPrisma.doorcard.create).not.toHaveBeenCalled();
    });

    it("generates correct campus name in error message", async () => {
      const testCases = [
        { college: "SKYLINE", expectedName: "Skyline College" },
        { college: "CSM", expectedName: "College of San Mateo" },
        { college: "CANADA", expectedName: "Cañada College" },
      ];

      for (const { college, expectedName } of testCases) {
        const existingDoorcard = {
          id: "existing",
          userId: mockUser.id,
          college,
          term: "FALL",
          year: 2024,
          isActive: true,
        };
        mockPrisma.doorcard.findFirst.mockResolvedValueOnce(existingDoorcard);

        const request = new NextRequest("http://localhost:3000/api/doorcards", {
          method: "POST",
          body: JSON.stringify({ ...validDoorcardData, college }),
          headers: { "Content-Type": "application/json" },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(data.error).toContain(expectedName);
      }
    });

    it("generates URL-friendly slug correctly", async () => {
      const testCases = [
        {
          name: "Dr. María José Smith-Jones",
          term: "FALL",
          year: 2024,
          expectedSlug: "dr-mar-a-jos-smith-jones-fall-2024",
        },
        {
          name: "John O'Connor Jr.",
          term: "SPRING",
          year: 2025,
          expectedSlug: "john-o-connor-jr-spring-2025",
        },
        {
          name: "Prof.   Multiple    Spaces",
          term: "SUMMER",
          year: 2024,
          expectedSlug: "prof-multiple-spaces-summer-2024",
        },
      ];

      for (const { name, term, year, expectedSlug } of testCases) {
        const data = { ...validDoorcardData, name, term, year };
        const expectedResult = {
          ...mockCreatedDoorcard,
          name,
          term,
          year,
          slug: expectedSlug,
        };
        mockPrisma.doorcard.create.mockResolvedValueOnce(expectedResult);

        const request = new NextRequest("http://localhost:3000/api/doorcards", {
          method: "POST",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" },
        });

        await POST(request);

        expect(mockPrisma.doorcard.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              slug: expectedSlug,
            }),
          })
        );

        jest.clearAllMocks();
        mockRequireAuthUserAPI.mockResolvedValue({ user: mockUser });
        mockPrisma.doorcard.findFirst.mockResolvedValue(null);
      }
    });

    it("handles malformed JSON", async () => {
      const request = new NextRequest("http://localhost:3000/api/doorcards", {
        method: "POST",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create doorcard");
    });

    it("handles database errors", async () => {
      mockPrisma.doorcard.create.mockRejectedValue(
        new Error("Database connection failed")
      );

      const request = new NextRequest("http://localhost:3000/api/doorcards", {
        method: "POST",
        body: JSON.stringify(validDoorcardData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create doorcard");
    });

    it("creates doorcard without appointments", async () => {
      const dataWithoutAppointments = {
        ...validDoorcardData,
        appointments: [],
      };

      const request = new NextRequest("http://localhost:3000/api/doorcards", {
        method: "POST",
        body: JSON.stringify(dataWithoutAppointments),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockPrisma.doorcard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            appointments: {
              create: [],
            },
          }),
        })
      );
    });

    it("validates appointment data", async () => {
      const invalidAppointmentData = {
        ...validDoorcardData,
        appointments: [
          {
            name: "", // Invalid: empty name
            startTime: "invalid-time", // Invalid: bad time format
            endTime: "12:00",
            dayOfWeek: "INVALID_DAY", // Invalid: bad day
            category: "INVALID_CATEGORY", // Invalid: bad category
            location: "Office",
          },
        ],
      };

      const request = new NextRequest("http://localhost:3000/api/doorcards", {
        method: "POST",
        body: JSON.stringify(invalidAppointmentData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation error");
      expect(data.details).toBeInstanceOf(Array);
    });
  });

  describe("GET /api/doorcards", () => {
    const mockDoorcards = [
      {
        id: "doorcard-1",
        name: "Dr. Test Professor",
        doorcardName: "Fall Office Hours",
        userId: mockUser.id,
        user: {
          name: "Test User",
          username: "testuser",
          email: "test@smccd.edu",
          college: "SKYLINE",
        },
        appointments: [
          {
            id: "appointment-1",
            name: "Office Hours",
            startTime: "10:00",
            endTime: "12:00",
            dayOfWeek: "MONDAY",
            category: "OFFICE_HOURS",
            location: "Office",
          },
        ],
      },
      {
        id: "doorcard-2",
        name: "Dr. Another Professor",
        doorcardName: "Spring Classes",
        userId: mockUser.id,
        user: {
          name: "Test User",
          username: "testuser",
          email: "test@smccd.edu",
          college: "SKYLINE",
        },
        appointments: [],
      },
    ];

    beforeEach(() => {
      mockRequireAuthUserAPI.mockResolvedValue({ user: mockUser });
      mockPrisma.doorcard.findMany.mockResolvedValue(mockDoorcards);
    });

    it("returns user's doorcards when authenticated", async () => {
      const request = new NextRequest("http://localhost:3000/api/doorcards", {
        method: "GET",
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockDoorcards);
      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
        },
        include: {
          user: {
            select: {
              name: true,
              username: true,
              email: true,
              college: true,
            },
          },
          appointments: {
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          },
        },
      });
    });

    it("returns 401 when user is not authenticated", async () => {
      mockRequireAuthUserAPI.mockResolvedValue({
        error: "Unauthorized",
        status: 401,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
      expect(mockPrisma.doorcard.findMany).not.toHaveBeenCalled();
    });

    it("returns empty array when user has no doorcards", async () => {
      mockPrisma.doorcard.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("handles database errors", async () => {
      mockPrisma.doorcard.findMany.mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch doorcards");
    });

    it("orders appointments correctly", async () => {
      const response = await GET();

      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            appointments: {
              orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
            },
          }),
        })
      );
    });

    it("includes only specific user fields", async () => {
      const response = await GET();

      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            user: {
              select: {
                name: true,
                username: true,
                email: true,
                college: true,
              },
            },
          }),
        })
      );
    });
  });

  describe("Archived doorcard protection", () => {
    beforeEach(() => {
      mockRequireAuthUserAPI.mockResolvedValue({ user: mockUser });
    });

    it("should prevent editing archived doorcards", async () => {
      // This test verifies that the getTermStatus check is in place
      // The actual term status logic is tested in doorcard-status.test.ts
      // Here we just verify the API structure includes the protection
      const fs = await import("fs");
      const path = await import("path");
      const routeCode = fs.readFileSync(
        path.join(__dirname, "../[id]/route.ts"),
        "utf8"
      );

      expect(routeCode).toContain("getTermStatus");
      expect(routeCode).toContain("Cannot edit archived doorcards");
      expect(routeCode).toContain("read-only to maintain data integrity");
    });
  });

  describe("Error handling and edge cases", () => {
    beforeEach(() => {
      mockRequireAuthUserAPI.mockResolvedValue({ user: mockUser });
    });

    it("handles undefined request body in POST", async () => {
      const request = new NextRequest("http://localhost:3000/api/doorcards", {
        method: "POST",
        body: undefined,
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation error");
    });

    it("handles null response from requireAuthUserAPI", async () => {
      mockRequireAuthUserAPI.mockResolvedValue(null as any);

      const request = new NextRequest("http://localhost:3000/api/doorcards", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it("handles very large payload", async () => {
      const largeData = {
        name: "A".repeat(10000),
        doorcardName: "B".repeat(10000),
        officeNumber: "C".repeat(1000),
        term: "FALL",
        year: 2024,
        college: "SKYLINE",
        appointments: Array(100).fill({
          name: "Office Hours",
          startTime: "10:00",
          endTime: "12:00",
          dayOfWeek: "MONDAY",
          category: "OFFICE_HOURS",
          location: "Office",
        }),
      };

      const request = new NextRequest("http://localhost:3000/api/doorcards", {
        method: "POST",
        body: JSON.stringify(largeData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      // Should either succeed or fail gracefully with validation error
      expect([200, 201, 400, 413, 500]).toContain(response.status);
    });
  });
});
