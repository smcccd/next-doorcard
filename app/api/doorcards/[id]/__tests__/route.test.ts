import { NextRequest } from "next/server";
import { GET, PUT, PATCH, DELETE } from "../route";
import { prisma } from "@/lib/prisma";
import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { getTermStatus } from "@/lib/doorcard-status";
import { randomUUID } from "crypto";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    doorcard: {
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    appointment: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/require-auth-user", () => ({
  requireAuthUserAPI: jest.fn(),
}));

jest.mock("@/lib/doorcard-status", () => ({
  getTermStatus: jest.fn(),
}));

jest.mock("crypto", () => ({
  randomUUID: jest.fn(() => "mock-uuid-123"),
}));

const mockPrisma = prisma as MockedObject<typeof prisma>;
const mockRequireAuthUserAPI = requireAuthUserAPI as MockedFunction<
  typeof requireAuthUserAPI
>;
const mockGetTermStatus = getTermStatus as MockedFunction<typeof getTermStatus>;

describe("Doorcard API Route [id]", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    role: "faculty" as const,
    college: "SKYLINE" as const,
  };

  const mockDoorcard = {
    id: "doorcard-123",
    userId: "user-123",
    name: "Dr. Test User",
    doorcardName: "Test Doorcard",
    officeNumber: "Room 101",
    term: "FALL",
    year: 2024,
    college: "SKYLINE",
    isActive: true,
    isPublic: true,
    startDate: null,
    endDate: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    Appointment: [],
    User: {
      name: "Test User",
      college: "SKYLINE",
      email: "test@example.com",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuthUserAPI.mockResolvedValue({ user: mockUser });
  });

  describe("GET /api/doorcards/[id]", () => {
    it("should return doorcard for authenticated user", async () => {
      mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);

      const params = Promise.resolve({ id: "doorcard-123" });
      const response = await GET(new NextRequest("http://test.com"), {
        params,
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockDoorcard);
      expect(mockPrisma.doorcard.findFirst).toHaveBeenCalledWith({
        where: { id: "doorcard-123", userId: "user-123" },
        include: {
          Appointment: {
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          },
          User: { select: { name: true, college: true, email: true } },
        },
      });
    });

    it("should return 404 when doorcard not found", async () => {
      mockPrisma.doorcard.findFirst.mockResolvedValue(null);

      const params = Promise.resolve({ id: "non-existent-id" });
      const response = await GET(new NextRequest("http://test.com"), {
        params,
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "Doorcard not found" });
    });

    it("should return auth error when user not authenticated", async () => {
      mockRequireAuthUserAPI.mockResolvedValue({
        error: "Unauthorized",
        status: 401,
      });

      const params = Promise.resolve({ id: "doorcard-123" });
      const response = await GET(new NextRequest("http://test.com"), {
        params,
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });
  });

  describe("PUT /api/doorcards/[id]", () => {
    const validPutData = {
      name: "Updated Name",
      doorcardName: "Updated Doorcard",
      officeNumber: "Room 202",
      term: "SPRING",
      year: "2025",
      college: "CSM",
      timeBlocks: [
        {
          activity: "Office Hours",
          startTime: "10:00",
          endTime: "12:00",
          dayOfWeek: "MONDAY",
          category: "OFFICE_HOURS",
          location: "Room 101",
        },
        {
          name: "Lab Session",
          startTime: "14:00",
          endTime: "16:00",
          day: "TUESDAY", // legacy field
          category: "LECTURE",
          location: null,
        },
      ],
    };

    it("should update doorcard with valid data", async () => {
      mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);
      mockGetTermStatus.mockReturnValue("current");
      mockPrisma.appointment.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.appointment.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.doorcard.update.mockResolvedValue({
        ...mockDoorcard,
        ...validPutData,
        year: 2025,
      });

      const request = new NextRequest("http://test.com", {
        method: "PUT",
        body: JSON.stringify(validPutData),
        headers: { "Content-Type": "application/json" },
      });
      const params = Promise.resolve({ id: "doorcard-123" });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.appointment.deleteMany).toHaveBeenCalledWith({
        where: { doorcardId: "doorcard-123" },
      });
      expect(mockPrisma.appointment.createMany).toHaveBeenCalledWith({
        data: [
          {
            id: "mock-uuid-123",
            doorcardId: "doorcard-123",
            name: "Office Hours",
            startTime: "10:00",
            endTime: "12:00",
            dayOfWeek: "MONDAY",
            category: "OFFICE_HOURS",
            location: "Room 101",
            updatedAt: expect.any(Date),
          },
          {
            id: "mock-uuid-123",
            doorcardId: "doorcard-123",
            name: "Lab Session",
            startTime: "14:00",
            endTime: "16:00",
            dayOfWeek: "TUESDAY",
            category: "LECTURE",
            location: null,
            updatedAt: expect.any(Date),
          },
        ],
      });
      expect(mockPrisma.doorcard.update).toHaveBeenCalled();
    });

    it("should handle empty timeBlocks array", async () => {
      mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);
      mockGetTermStatus.mockReturnValue("current");
      mockPrisma.appointment.deleteMany.mockResolvedValue({ count: 0 });

      const request = new NextRequest("http://test.com", {
        method: "PUT",
        body: JSON.stringify({ ...validPutData, timeBlocks: [] }),
        headers: { "Content-Type": "application/json" },
      });
      const params = Promise.resolve({ id: "doorcard-123" });

      await PUT(request, { params });

      expect(mockPrisma.appointment.deleteMany).toHaveBeenCalledWith({
        where: { doorcardId: "doorcard-123" },
      });
      expect(mockPrisma.appointment.createMany).not.toHaveBeenCalled();
    });

    it("should handle missing timeBlocks field", async () => {
      mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);
      mockGetTermStatus.mockReturnValue("current");

      const request = new NextRequest("http://test.com", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Name" }),
        headers: { "Content-Type": "application/json" },
      });
      const params = Promise.resolve({ id: "doorcard-123" });

      await PUT(request, { params });

      expect(mockPrisma.appointment.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.appointment.createMany).not.toHaveBeenCalled();
    });

    it("should return 404 when doorcard not found", async () => {
      mockPrisma.doorcard.findFirst.mockResolvedValue(null);

      const request = new NextRequest("http://test.com", {
        method: "PUT",
        body: JSON.stringify(validPutData),
        headers: { "Content-Type": "application/json" },
      });
      const params = Promise.resolve({ id: "non-existent-id" });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "Doorcard not found" });
    });

    it("should return 403 when trying to edit archived doorcard", async () => {
      mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);
      mockGetTermStatus.mockReturnValue("past");

      const request = new NextRequest("http://test.com", {
        method: "PUT",
        body: JSON.stringify(validPutData),
        headers: { "Content-Type": "application/json" },
      });
      const params = Promise.resolve({ id: "doorcard-123" });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({
        error:
          "Cannot edit archived doorcards. Archived doorcards are read-only to maintain data integrity.",
      });
    });

    it("should return 400 for invalid data", async () => {
      const request = new NextRequest("http://test.com", {
        method: "PUT",
        body: JSON.stringify({ college: "INVALID_COLLEGE" }),
        headers: { "Content-Type": "application/json" },
      });
      const params = Promise.resolve({ id: "doorcard-123" });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error");
    });

    it("should handle timeblock with default values", async () => {
      mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);
      mockGetTermStatus.mockReturnValue("current");
      mockPrisma.appointment.createMany.mockResolvedValue({ count: 1 });

      const timeBlockWithDefaults = {
        startTime: "10:00",
        endTime: "12:00",
        // Missing activity/name, dayOfWeek/day, category - should use defaults
      };

      const request = new NextRequest("http://test.com", {
        method: "PUT",
        body: JSON.stringify({ timeBlocks: [timeBlockWithDefaults] }),
        headers: { "Content-Type": "application/json" },
      });
      const params = Promise.resolve({ id: "doorcard-123" });

      await PUT(request, { params });

      expect(mockPrisma.appointment.createMany).toHaveBeenCalledWith({
        data: [
          {
            id: "mock-uuid-123",
            doorcardId: "doorcard-123",
            name: "Office Hours", // default
            startTime: "10:00",
            endTime: "12:00",
            dayOfWeek: "MONDAY", // default
            category: "OFFICE_HOURS", // default
            location: null, // default
            updatedAt: expect.any(Date),
          },
        ],
      });
    });
  });

  describe("PATCH /api/doorcards/[id]", () => {
    const validPatchData = {
      isActive: false,
      isPublic: true,
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      timeblocks: [
        {
          activity: "New Activity",
          startTime: "09:00",
          endTime: "11:00",
          dayOfWeek: "FRIDAY",
        },
      ],
    };

    it("should update doorcard with patch data", async () => {
      mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);
      mockGetTermStatus.mockReturnValue("current");
      mockPrisma.appointment.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.appointment.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.doorcard.update.mockResolvedValue({
        ...mockDoorcard,
        isActive: false,
      });

      const request = new NextRequest("http://test.com", {
        method: "PATCH",
        body: JSON.stringify(validPatchData),
        headers: { "Content-Type": "application/json" },
      });
      const params = Promise.resolve({ id: "doorcard-123" });

      const response = await PATCH(request, { params });

      expect(response.status).toBe(200);
      expect(mockPrisma.doorcard.update).toHaveBeenCalledWith({
        where: { id: "doorcard-123" },
        data: {
          name: undefined,
          doorcardName: undefined,
          officeNumber: undefined,
          term: undefined,
          year: undefined,
          college: undefined,
          isPublic: true,
          isActive: false,
        },
        include: expect.any(Object),
      });
    });

    it("should handle patch without timeblocks", async () => {
      mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);
      mockGetTermStatus.mockReturnValue("current");
      mockPrisma.doorcard.update.mockResolvedValue(mockDoorcard);

      const request = new NextRequest("http://test.com", {
        method: "PATCH",
        body: JSON.stringify({ isActive: false }),
        headers: { "Content-Type": "application/json" },
      });
      const params = Promise.resolve({ id: "doorcard-123" });

      await PATCH(request, { params });

      expect(mockPrisma.appointment.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.appointment.createMany).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /api/doorcards/[id]", () => {
    it("should delete doorcard for authenticated user", async () => {
      mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);
      mockPrisma.doorcard.delete.mockResolvedValue(mockDoorcard);

      const params = Promise.resolve({ id: "doorcard-123" });
      const response = await DELETE(new NextRequest("http://test.com"), {
        params,
      });

      expect(response.status).toBe(200);
      expect(mockPrisma.doorcard.delete).toHaveBeenCalledWith({
        where: { id: "doorcard-123", userId: "user-123" },
      });
    });

    it("should handle deletion of non-existent doorcard", async () => {
      // DELETE doesn't check existence first, so Prisma will throw
      mockPrisma.doorcard.delete.mockRejectedValue(
        new Error("Record not found")
      );

      const params = Promise.resolve({ id: "non-existent-id" });
      const response = await DELETE(new NextRequest("http://test.com"), {
        params,
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to delete doorcard" });
    });

    it("should handle deletion errors", async () => {
      mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);
      mockPrisma.doorcard.delete.mockRejectedValue(new Error("Database error"));

      const params = Promise.resolve({ id: "doorcard-123" });
      const response = await DELETE(new NextRequest("http://test.com"), {
        params,
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty("error");
    });
  });

  describe("Auth handling", () => {
    it("should handle auth errors consistently across all methods", async () => {
      mockRequireAuthUserAPI.mockResolvedValue({
        error: "Token expired",
        status: 401,
      });

      const params = Promise.resolve({ id: "doorcard-123" });
      const request = new NextRequest("http://test.com");

      const getResponse = await GET(request, { params });
      expect(getResponse.status).toBe(401);

      const putResponse = await PUT(request, { params });
      expect(putResponse.status).toBe(401);

      const patchResponse = await PATCH(request, { params });
      expect(patchResponse.status).toBe(401);

      const deleteResponse = await DELETE(request, { params });
      expect(deleteResponse.status).toBe(401);
    });
  });

  describe("Error handling", () => {
    it("should handle JSON parsing errors", async () => {
      const request = new NextRequest("http://test.com", {
        method: "PUT",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });
      const params = Promise.resolve({ id: "doorcard-123" });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty("error");
    });

    it("should propagate database errors in GET", async () => {
      mockPrisma.doorcard.findFirst.mockRejectedValue(
        new Error("Database connection failed")
      );

      const params = Promise.resolve({ id: "doorcard-123" });

      // GET method doesn't have try/catch so the error propagates
      await expect(
        GET(new NextRequest("http://test.com"), { params })
      ).rejects.toThrow("Database connection failed");
    });

    it("should handle database errors in PUT", async () => {
      mockPrisma.doorcard.findFirst.mockRejectedValue(
        new Error("Database error")
      );

      const request = new NextRequest("http://test.com", {
        method: "PUT",
        body: JSON.stringify({ name: "Test" }),
        headers: { "Content-Type": "application/json" },
      });
      const params = Promise.resolve({ id: "doorcard-123" });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty("error");
    });
  });
});
