/**
 * @jest-environment node
 */

import {
  createDoorcardWithCampusTerm,
  validateCampusTerm,
  updateBasicInfo,
  publishDoorcard,
  deleteDoorcard,
} from "../actions";
import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Mock dependencies
jest.mock("@/lib/require-auth-user");
jest.mock("@/lib/prisma");
jest.mock("next/navigation");
jest.mock("next/cache");

const mockRequireAuthUserAPI = requireAuthUserAPI as jest.MockedFunction<
  typeof requireAuthUserAPI
>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

// Mock user
const mockUser = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
};

// Mock doorcard
const mockDoorcard = {
  id: "doorcard-123",
  name: "Dr. Test Professor",
  doorcardName: "Test Doorcard",
  officeNumber: "Room 101",
  term: "FALL",
  year: 2024,
  college: "SKYLINE",
  isActive: false,
  isPublic: false,
  userId: "user-123",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Doorcard Server Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default auth success
    mockRequireAuthUserAPI.mockResolvedValue({ user: mockUser });

    // Prevent actual redirects in tests
    mockRedirect.mockImplementation(() => {
      throw new Error("REDIRECT"); // This is expected behavior
    });
  });

  describe("createDoorcardWithCampusTerm", () => {
    it("should create doorcard with valid data", async () => {
      mockPrisma.doorcard.findFirst.mockResolvedValue(null);
      mockPrisma.doorcard.create.mockResolvedValue(mockDoorcard as any);

      const formData = new FormData();
      formData.set("college", "SKYLINE");
      formData.set("term", "Fall");
      formData.set("year", "2024");

      await expect(
        createDoorcardWithCampusTerm({ success: true }, formData)
      ).rejects.toThrow("REDIRECT");

      expect(mockPrisma.doorcard.create).toHaveBeenCalledWith({
        data: {
          college: "SKYLINE",
          term: "FALL",
          year: 2024,
          userId: "user-123",
          isActive: false,
          isPublic: false,
        },
      });
    });

    it("should return error for duplicate doorcard", async () => {
      mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard as any);

      const formData = new FormData();
      formData.set("college", "SKYLINE");
      formData.set("term", "Fall");
      formData.set("year", "2024");

      const result = await createDoorcardWithCampusTerm(
        { success: true },
        formData
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("already have a doorcard");
      expect(mockPrisma.doorcard.create).not.toHaveBeenCalled();
    });

    it("should return error for invalid data", async () => {
      const formData = new FormData();
      formData.set("college", "INVALID");
      formData.set("term", "Fall");
      formData.set("year", "2024");

      const result = await createDoorcardWithCampusTerm(
        { success: true },
        formData
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("validation");
    });

    it("should handle authentication errors", async () => {
      mockRequireAuthUserAPI.mockResolvedValue({
        error: "Unauthorized",
        status: 401,
      } as any);

      const formData = new FormData();
      formData.set("college", "SKYLINE");
      formData.set("term", "Fall");
      formData.set("year", "2024");

      await expect(
        createDoorcardWithCampusTerm({ success: true }, formData)
      ).rejects.toThrow("Unauthorized");
    });

    it("should validate year range", async () => {
      const formData = new FormData();
      formData.set("college", "SKYLINE");
      formData.set("term", "Fall");
      formData.set("year", "1999"); // Too old

      const result = await createDoorcardWithCampusTerm(
        { success: true },
        formData
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("validation");
    });
  });

  describe("validateCampusTerm", () => {
    it("should validate and redirect on success", async () => {
      mockPrisma.doorcard.findUnique.mockResolvedValue(mockDoorcard as any);
      mockPrisma.doorcard.findFirst.mockResolvedValue(null);

      const formData = new FormData();
      formData.set("college", "CSM");
      formData.set("term", "Spring");
      formData.set("year", "2025");

      await expect(
        validateCampusTerm("doorcard-123", { success: true }, formData)
      ).rejects.toThrow("REDIRECT");

      expect(mockPrisma.doorcard.update).toHaveBeenCalledWith({
        where: { id: "doorcard-123", userId: "user-123" },
        data: {
          college: "CSM",
          term: "SPRING",
          year: 2025,
        },
      });
    });

    it("should return error for non-existent doorcard", async () => {
      mockPrisma.doorcard.findUnique.mockResolvedValue(null);

      const formData = new FormData();
      formData.set("college", "SKYLINE");
      formData.set("term", "Fall");
      formData.set("year", "2024");

      const result = await validateCampusTerm(
        "non-existent",
        { success: true },
        formData
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("Doorcard not found");
    });

    it("should return error for duplicate term combination", async () => {
      mockPrisma.doorcard.findUnique.mockResolvedValue(mockDoorcard as any);
      mockPrisma.doorcard.findFirst.mockResolvedValue({
        id: "other-doorcard",
      } as any);

      const formData = new FormData();
      formData.set("college", "SKYLINE");
      formData.set("term", "Fall");
      formData.set("year", "2024");

      const result = await validateCampusTerm(
        "doorcard-123",
        { success: true },
        formData
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("already have a doorcard");
    });
  });

  describe("updateBasicInfo", () => {
    it("should update basic information successfully", async () => {
      mockPrisma.doorcard.findUnique.mockResolvedValue(mockDoorcard as any);
      mockPrisma.doorcard.update.mockResolvedValue({
        ...mockDoorcard,
        name: "Updated Name",
      } as any);

      const formData = new FormData();
      formData.set("name", "Updated Name");
      formData.set("doorcardName", "Updated Doorcard");
      formData.set("officeNumber", "Room 202");

      await expect(
        updateBasicInfo("doorcard-123", { success: true }, formData)
      ).rejects.toThrow("REDIRECT");

      expect(mockPrisma.doorcard.update).toHaveBeenCalledWith({
        where: { id: "doorcard-123", userId: "user-123" },
        data: {
          name: "Updated Name",
          doorcardName: "Updated Doorcard",
          officeNumber: "Room 202",
        },
      });
    });

    it("should return error for invalid data", async () => {
      const formData = new FormData();
      formData.set("name", ""); // Required field empty
      formData.set("doorcardName", "Valid Name");
      formData.set("officeNumber", "Room 101");

      const result = await updateBasicInfo(
        "doorcard-123",
        { success: true },
        formData
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("validation");
    });

    it("should handle non-existent doorcard", async () => {
      mockPrisma.doorcard.findUnique.mockResolvedValue(null);

      const formData = new FormData();
      formData.set("name", "Test Name");
      formData.set("doorcardName", "Test Doorcard");
      formData.set("officeNumber", "Room 101");

      const result = await updateBasicInfo(
        "non-existent",
        { success: true },
        formData
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("Doorcard not found");
    });
  });

  describe("publishDoorcard", () => {
    it("should publish doorcard successfully", async () => {
      mockPrisma.doorcard.findUnique.mockResolvedValue(mockDoorcard as any);
      mockPrisma.doorcard.update.mockResolvedValue({
        ...mockDoorcard,
        isActive: true,
        isPublic: true,
      } as any);

      await publishDoorcard("doorcard-123");

      expect(mockPrisma.doorcard.update).toHaveBeenCalledWith({
        where: { id: "doorcard-123", userId: "user-123" },
        data: { isActive: true, isPublic: true },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    });

    it("should handle non-existent doorcard", async () => {
      mockPrisma.doorcard.findUnique.mockResolvedValue(null);

      await expect(publishDoorcard("non-existent")).rejects.toThrow(
        "Doorcard not found"
      );
    });

    it("should handle authentication errors", async () => {
      mockRequireAuthUserAPI.mockResolvedValue({
        error: "Unauthorized",
        status: 401,
      } as any);

      await expect(publishDoorcard("doorcard-123")).rejects.toThrow(
        "Unauthorized"
      );
    });
  });

  describe("deleteDoorcard", () => {
    it("should delete doorcard and appointments", async () => {
      mockPrisma.doorcard.findUnique.mockResolvedValue(mockDoorcard as any);
      mockPrisma.appointment.deleteMany.mockResolvedValue({ count: 5 });
      mockPrisma.doorcard.delete.mockResolvedValue(mockDoorcard as any);

      await expect(deleteDoorcard("doorcard-123")).rejects.toThrow("REDIRECT");

      expect(mockPrisma.appointment.deleteMany).toHaveBeenCalledWith({
        where: { doorcardId: "doorcard-123" },
      });
      expect(mockPrisma.doorcard.delete).toHaveBeenCalledWith({
        where: { id: "doorcard-123", userId: "user-123" },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    });

    it("should handle non-existent doorcard", async () => {
      mockPrisma.doorcard.findUnique.mockResolvedValue(null);

      const result = await deleteDoorcard("non-existent");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Doorcard not found");
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.doorcard.findUnique.mockResolvedValue(mockDoorcard as any);
      mockPrisma.appointment.deleteMany.mockRejectedValue(
        new Error("Database error")
      );

      const result = await deleteDoorcard("doorcard-123");

      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to delete");
    });
  });

  describe("Schema Validation", () => {
    it("should validate campus enum correctly", async () => {
      const formData = new FormData();
      formData.set("college", "INVALID_CAMPUS");
      formData.set("term", "Fall");
      formData.set("year", "2024");

      const result = await createDoorcardWithCampusTerm(
        { success: true },
        formData
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("Campus is required");
    });

    it("should validate term enum correctly", async () => {
      const formData = new FormData();
      formData.set("college", "SKYLINE");
      formData.set("term", "InvalidTerm");
      formData.set("year", "2024");

      const result = await createDoorcardWithCampusTerm(
        { success: true },
        formData
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("validation");
    });

    it("should coerce year to number", async () => {
      mockPrisma.doorcard.findFirst.mockResolvedValue(null);
      mockPrisma.doorcard.create.mockResolvedValue(mockDoorcard as any);

      const formData = new FormData();
      formData.set("college", "SKYLINE");
      formData.set("term", "Fall");
      formData.set("year", "2024"); // String input

      await expect(
        createDoorcardWithCampusTerm({ success: true }, formData)
      ).rejects.toThrow("REDIRECT");

      expect(mockPrisma.doorcard.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          year: 2024, // Should be converted to number
        }),
      });
    });
  });

  describe("Campus Label Helper", () => {
    // This tests the internal campusLabel function through error messages
    it("should provide correct campus labels in error messages", async () => {
      mockPrisma.doorcard.findFirst.mockResolvedValue({
        id: "existing",
      } as any);

      const testCases = [
        { college: "SKYLINE", expected: "Skyline College" },
        { college: "CSM", expected: "College of San Mateo" },
        { college: "CANADA", expected: "Cañada College" },
      ];

      for (const { college, expected } of testCases) {
        const formData = new FormData();
        formData.set("college", college);
        formData.set("term", "Fall");
        formData.set("year", "2024");

        const result = await createDoorcardWithCampusTerm(
          { success: true },
          formData
        );

        expect(result.message).toContain(expected);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors", async () => {
      mockPrisma.doorcard.findFirst.mockRejectedValue(
        new Error("Database connection failed")
      );

      const formData = new FormData();
      formData.set("college", "SKYLINE");
      formData.set("term", "Fall");
      formData.set("year", "2024");

      const result = await createDoorcardWithCampusTerm(
        { success: true },
        formData
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("An error occurred");
    });

    it("should handle validation errors gracefully", async () => {
      const formData = new FormData();
      // Missing required fields

      const result = await createDoorcardWithCampusTerm(
        { success: true },
        formData
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("validation");
    });
  });
});
