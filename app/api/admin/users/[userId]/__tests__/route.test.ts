import { NextRequest } from "next/server";
import { GET } from "../route";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

// Mock dependencies
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type,
  MockedFunction,
  type,
  MockedObject,
  vi,
} from "vitest";

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

const mockGetServerSession = getServerSession as MockedFunction<
  typeof getServerSession
>;
const mockPrisma = prisma as MockedObject<typeof prisma>;

describe("Admin Users [userId] API Route", () => {
  const adminSession = {
    user: { email: "admin@example.com" },
  };

  const adminUser = {
    role: "ADMIN",
  };

  const mockUser = {
    id: "user-123",
    email: "user@example.com",
    name: "John Doe",
    firstName: "John",
    lastName: "Doe",
    username: "johndoe",
    role: "FACULTY",
    college: "SKYLINE",
    title: "Dr.",
    pronouns: "he/him",
    website: "https://example.com",
    displayFormat: "FULL_NAME",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-15"),
    Doorcard: [
      {
        id: "doorcard-1",
        name: "Dr. John Doe",
        doorcardName: "Fall Office Hours",
        term: "FALL",
        year: 2024,
        college: "SKYLINE",
        isActive: true,
        isPublic: true,
        officeNumber: "Room 101",
        createdAt: new Date("2024-09-01"),
        updatedAt: new Date("2024-09-15"),
        _count: { Appointment: 3 },
        Appointment: [
          {
            id: "appt-1",
            name: "Office Hours",
            startTime: "10:00",
            endTime: "12:00",
            dayOfWeek: "MONDAY",
            category: "OFFICE_HOURS",
            location: "Room 101",
          },
        ],
      },
    ],
  };

  const expectedProcessedUser = {
    id: "user-123",
    email: "user@example.com",
    name: "John Doe",
    firstName: "John",
    lastName: "Doe",
    username: "johndoe",
    role: "FACULTY",
    college: "SKYLINE",
    title: "Dr.",
    pronouns: "he/him",
    website: "https://example.com",
    displayFormat: "FULL_NAME",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z",
    doorcards: [
      {
        id: "doorcard-1",
        name: "Dr. John Doe",
        doorcardName: "Fall Office Hours",
        term: "FALL",
        year: 2024,
        college: "SKYLINE",
        isActive: true,
        isPublic: true,
        officeNumber: "Room 101",
        createdAt: "2024-09-01T00:00:00.000Z",
        updatedAt: "2024-09-15T00:00:00.000Z",
        appointmentCount: 3,
        appointments: [
          {
            id: "appt-1",
            name: "Office Hours",
            startTime: "10:00",
            endTime: "12:00",
            dayOfWeek: "MONDAY",
            category: "OFFICE_HOURS",
            location: "Room 101",
          },
        ],
      },
    ],
    totalDoorcards: 1,
    activeDoorcards: 1,
    totalAppointments: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/users/[userId]", () => {
    it("should return user details for admin", async () => {
      mockGetServerSession.mockResolvedValue(adminSession);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(adminUser) // Admin check
        .mockResolvedValueOnce(mockUser); // User details

      const params = Promise.resolve({ userId: "user-123" });
      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/user-123"
      );

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(expectedProcessedUser);

      // Verify admin check
      expect(mockPrisma.user.findUnique).toHaveBeenNthCalledWith(1, {
        where: { email: "admin@example.com" },
        select: { role: true },
      });

      // Verify user details query
      expect(mockPrisma.user.findUnique).toHaveBeenNthCalledWith(2, {
        where: { id: "user-123" },
        select: expect.objectContaining({
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          username: true,
          role: true,
          college: true,
          title: true,
          pronouns: true,
          website: true,
          displayFormat: true,
          createdAt: true,
          updatedAt: true,
          Doorcard: expect.any(Object),
        }),
      });
    });

    it("should return 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const params = Promise.resolve({ userId: "user-123" });
      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/user-123"
      );

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("should return 403 when user is not admin", async () => {
      mockGetServerSession.mockResolvedValue(adminSession);
      mockPrisma.user.findUnique.mockResolvedValue({ role: "FACULTY" }); // Not admin

      const params = Promise.resolve({ userId: "user-123" });
      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/user-123"
      );

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({ error: "Forbidden - Admin access required" });
    });

    it("should return 404 when target user not found", async () => {
      mockGetServerSession.mockResolvedValue(adminSession);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(adminUser) // Admin check passes
        .mockResolvedValueOnce(null); // Target user not found

      const params = Promise.resolve({ userId: "nonexistent-user" });
      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/nonexistent-user"
      );

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "User not found" });
    });

    it("should return 500 on database error", async () => {
      mockGetServerSession.mockResolvedValue(adminSession);
      mockPrisma.user.findUnique.mockRejectedValue(new Error("Database error"));

      const params = Promise.resolve({ userId: "user-123" });
      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/user-123"
      );

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch user details" });
    });

    it("should handle user without doorcards", async () => {
      const userWithoutDoorcards = {
        ...mockUser,
        Doorcard: [],
      };

      const expectedUserWithoutDoorcards = {
        ...expectedProcessedUser,
        doorcards: [],
        totalDoorcards: 0,
        activeDoorcards: 0,
        totalAppointments: 0,
      };

      mockGetServerSession.mockResolvedValue(adminSession);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(userWithoutDoorcards);

      const params = Promise.resolve({ userId: "user-123" });
      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/user-123"
      );

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.doorcards).toEqual([]);
      expect(data.totalDoorcards).toBe(0);
      expect(data.activeDoorcards).toBe(0);
      expect(data.totalAppointments).toBe(0);
    });
  });
});
