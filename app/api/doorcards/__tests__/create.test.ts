import { POST } from "../route";
import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// Mock dependencies
jest.mock("@/lib/require-auth-user");
jest.mock("@/lib/prisma", () => ({
  prisma: {
    doorcard: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    appointment: {
      createMany: jest.fn(),
    },
  },
}));

const mockRequireAuthUserAPI = requireAuthUserAPI as MockedFunction<
  typeof requireAuthUserAPI
>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("/api/doorcards POST", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
  };

  const validDoorcardData = {
    college: "SKYLINE",
    term: "FALL",
    year: 2024,
    name: "Dr. Test Professor",
    doorcardName: "Test Doorcard",
    officeNumber: "Room 101",
    email: "test@example.com",
    phone: "555-1234",
    isActive: false,
    isPublic: false,
    appointments: [
      {
        name: "Office Hours",
        startTime: "09:00",
        endTime: "10:00",
        dayOfWeek: "MONDAY",
        location: "Room 101",
        category: "OFFICE_HOURS",
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuthUserAPI.mockResolvedValue({ user: mockUser });
  });

  it("should create doorcard successfully", async () => {
    mockPrisma.doorcard.findFirst.mockResolvedValue(null); // No existing doorcard

    const mockCreatedDoorcard = {
      id: "doorcard-123",
      ...validDoorcardData,
      userId: mockUser.id,
      isActive: false,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPrisma.doorcard.create.mockResolvedValue(mockCreatedDoorcard as any);
    mockPrisma.appointment.createMany.mockResolvedValue({ count: 1 });

    const request = new NextRequest("http://localhost:3000/api/doorcards", {
      method: "POST",
      body: JSON.stringify(validDoorcardData),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe("doorcard-123");
    expect(mockPrisma.doorcard.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          college: "SKYLINE",
          term: "FALL",
          year: 2024,
          userId: mockUser.id,
        }),
      })
    );
  });

  it("should return 401 for unauthenticated user", async () => {
    mockRequireAuthUserAPI.mockResolvedValue({
      error: "Unauthorized",
      status: 401,
    } as any);

    const request = new NextRequest("http://localhost:3000/api/doorcards", {
      method: "POST",
      body: JSON.stringify(validDoorcardData),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
    expect(mockPrisma.doorcard.create).not.toHaveBeenCalled();
  });

  it("should return 409 for duplicate doorcard", async () => {
    const existingDoorcard = {
      id: "existing-123",
      college: "SKYLINE",
      term: "FALL",
      year: 2024,
      userId: mockUser.id,
    };

    mockPrisma.doorcard.findFirst.mockResolvedValue(existingDoorcard as any);

    const request = new NextRequest("http://localhost:3000/api/doorcards", {
      method: "POST",
      body: JSON.stringify(validDoorcardData),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain("You already have a doorcard");
    expect(data.existingDoorcardId).toBe("existing-123");
    expect(mockPrisma.doorcard.create).not.toHaveBeenCalled();
  });

  it("should validate request data", async () => {
    const invalidData = {
      // Missing required fields
      college: "SKYLINE",
      // Missing term, year, etc.
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
    expect(mockPrisma.doorcard.create).not.toHaveBeenCalled();
  });

  it("should handle database creation errors", async () => {
    mockPrisma.doorcard.findFirst.mockResolvedValue(null);
    mockPrisma.doorcard.create.mockRejectedValue(new Error("Database error"));

    const request = new NextRequest("http://localhost:3000/api/doorcards", {
      method: "POST",
      body: JSON.stringify(validDoorcardData),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty("error");
    expect(typeof data.error).toBe("string");
    expect(data.error.length).toBeGreaterThan(0);
  });

  it("should handle invalid JSON", async () => {
    const request = new NextRequest("http://localhost:3000/api/doorcards", {
      method: "POST",
      body: "invalid json",
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty("error");
    expect(typeof data.error).toBe("string");
    expect(data.error.length).toBeGreaterThan(0);
  });

  it("should return different error messages for different campuses", async () => {
    const testCases = [
      { college: "SKYLINE", expected: "Skyline College" },
      { college: "CSM", expected: "College of San Mateo" },
      { college: "CANADA", expected: "Cañada College" },
    ];

    for (const testCase of testCases) {
      const existingDoorcard = {
        id: "existing-123",
        college: testCase.college,
        term: "FALL",
        year: 2024,
        userId: mockUser.id,
      };

      mockPrisma.doorcard.findFirst.mockResolvedValue(existingDoorcard as any);

      const request = new NextRequest("http://localhost:3000/api/doorcards", {
        method: "POST",
        body: JSON.stringify({
          ...validDoorcardData,
          college: testCase.college,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain(testCase.expected);

      jest.clearAllMocks();
      mockRequireAuthUserAPI.mockResolvedValue({ user: mockUser });
    }
  });
});
