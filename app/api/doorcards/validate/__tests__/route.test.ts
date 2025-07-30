import { NextRequest } from "next/server";
import { POST } from "../route";
import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { prisma } from "@/lib/prisma";

// Mock dependencies
jest.mock("@/lib/require-auth-user", () => ({
  requireAuthUserAPI: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    doorcard: {
      findFirst: jest.fn(),
    },
  },
}));

const mockRequireAuthUserAPI = requireAuthUserAPI as jest.MockedFunction<
  typeof requireAuthUserAPI
>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("Doorcard Validate API Route", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Suppress console.error in tests
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Default successful auth
    mockRequireAuthUserAPI.mockResolvedValue({ user: mockUser });

    // Reset prisma mocks to clean state
    mockPrisma.doorcard.findFirst.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("POST /api/doorcards/validate", () => {
    const createRequest = (body: any) => {
      return new NextRequest("http://localhost:3000/api/doorcards/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    };

    describe("Authentication", () => {
      it("should return 401 when not authenticated", async () => {
        mockRequireAuthUserAPI.mockResolvedValue({
          error: "Unauthorized",
          status: 401,
        });

        const request = createRequest({
          college: "SKYLINE",
          term: "FALL",
          year: "2024",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data).toEqual({ error: "Unauthorized" });
        expect(mockPrisma.doorcard.findFirst).not.toHaveBeenCalled();
      });

      it("should handle auth service errors with custom status", async () => {
        mockRequireAuthUserAPI.mockResolvedValue({
          error: "Forbidden",
          status: 403,
        });

        const request = createRequest({
          college: "SKYLINE",
          term: "FALL",
          year: "2024",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data).toEqual({ error: "Forbidden" });
      });
    });

    describe("Request validation", () => {
      it("should validate required fields", async () => {
        const request = createRequest({});

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Validation error");
        expect(data.details).toHaveLength(3); // college, term, year are required
      });

      it("should validate college enum", async () => {
        const request = createRequest({
          college: "INVALID",
          term: "FALL",
          year: "2024",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Validation error");
        expect(data.details).toEqual([
          {
            code: "invalid_enum_value",
            message:
              "Invalid enum value. Expected 'SKYLINE' | 'CSM' | 'CANADA', received 'INVALID'",
            options: ["SKYLINE", "CSM", "CANADA"],
            path: ["college"],
            received: "INVALID",
          },
        ]);
      });

      it("should validate year format", async () => {
        const request = createRequest({
          college: "SKYLINE",
          term: "FALL",
          year: "24", // Should be 4 digits
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Validation error");
        expect(data.details[0].message).toBe("Year must be 4 digits");
      });

      it("should validate term is not empty", async () => {
        const request = createRequest({
          college: "SKYLINE",
          term: "",
          year: "2024",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Validation error");
        expect(data.details[0].message).toBe("Term is required");
      });

      it("should accept valid input", async () => {
        mockPrisma.doorcard.findFirst.mockResolvedValue(null); // No existing doorcard

        const request = createRequest({
          college: "SKYLINE",
          term: "FALL",
          year: "2024",
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockPrisma.doorcard.findFirst).toHaveBeenCalled();
      });
    });

    describe("Exclude doorcard validation", () => {
      it("should validate excluded doorcard ownership", async () => {
        mockPrisma.doorcard.findFirst
          .mockResolvedValueOnce(null) // No owned doorcard found
          .mockResolvedValueOnce(null); // No existing doorcard

        const request = createRequest({
          college: "SKYLINE",
          term: "FALL",
          year: "2024",
          excludeDoorcardId: "doorcard-123",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({ error: "Invalid doorcard reference" });

        // Should check ownership first
        expect(mockPrisma.doorcard.findFirst).toHaveBeenCalledWith({
          where: { id: "doorcard-123", userId: "user-123" },
          select: { id: true },
        });
      });

      it("should proceed when excluded doorcard is owned by user", async () => {
        // Clear previous mocks and set up fresh ones
        mockPrisma.doorcard.findFirst.mockClear();
        mockPrisma.doorcard.findFirst
          .mockResolvedValueOnce({ id: "doorcard-123" }) // Owned doorcard found
          .mockResolvedValueOnce(null); // No conflicting doorcard

        const request = createRequest({
          college: "SKYLINE",
          term: "FALL",
          year: "2024",
          excludeDoorcardId: "doorcard-123",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.isDuplicate).toBe(false);
      });
    });

    describe("Duplicate detection", () => {
      it("should detect duplicate doorcard - SKYLINE", async () => {
        const existingDoorcard = {
          id: "existing-123",
          doorcardName: "Fall Office Hours",
        };

        mockPrisma.doorcard.findFirst.mockClear();
        mockPrisma.doorcard.findFirst.mockResolvedValue(existingDoorcard);

        const request = createRequest({
          college: "SKYLINE",
          term: "FALL",
          year: "2024",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          isDuplicate: true,
          message:
            "You already have a doorcard for Skyline College - FALL 2024",
          existingDoorcardId: "existing-123",
          existingDoorcardName: "Fall Office Hours",
        });

        expect(mockPrisma.doorcard.findFirst).toHaveBeenCalledWith({
          where: {
            userId: "user-123",
            college: "SKYLINE",
            term: "FALL",
            year: 2024,
            isActive: true,
          },
          select: { id: true, doorcardName: true },
        });
      });

      it("should detect duplicate doorcard - CSM", async () => {
        const existingDoorcard = {
          id: "existing-456",
          doorcardName: "Spring Classes",
        };

        mockPrisma.doorcard.findFirst.mockClear();
        mockPrisma.doorcard.findFirst.mockResolvedValue(existingDoorcard);

        const request = createRequest({
          college: "CSM",
          term: "SPRING",
          year: "2024",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          isDuplicate: true,
          message:
            "You already have a doorcard for College of San Mateo - SPRING 2024",
          existingDoorcardId: "existing-456",
          existingDoorcardName: "Spring Classes",
        });
      });

      it("should detect duplicate doorcard - CANADA", async () => {
        const existingDoorcard = {
          id: "existing-789",
          doorcardName: "Summer Session",
        };

        mockPrisma.doorcard.findFirst.mockResolvedValue(existingDoorcard);

        const request = createRequest({
          college: "CANADA",
          term: "SUMMER",
          year: "2024",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          isDuplicate: true,
          message:
            "You already have a doorcard for Cañada College - SUMMER 2024",
          existingDoorcardId: "existing-789",
          existingDoorcardName: "Summer Session",
        });
      });

      it("should exclude specified doorcard from duplicate check", async () => {
        mockPrisma.doorcard.findFirst
          .mockResolvedValueOnce({ id: "doorcard-exclude" }) // Ownership check passes
          .mockResolvedValueOnce(null); // No other duplicate found

        const request = createRequest({
          college: "SKYLINE",
          term: "FALL",
          year: "2024",
          excludeDoorcardId: "doorcard-exclude",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.isDuplicate).toBe(false);

        // Should include NOT clause in duplicate check
        expect(mockPrisma.doorcard.findFirst).toHaveBeenLastCalledWith({
          where: {
            userId: "user-123",
            college: "SKYLINE",
            term: "FALL",
            year: 2024,
            isActive: true,
            NOT: { id: "doorcard-exclude" },
          },
          select: { id: true, doorcardName: true },
        });
      });

      it("should allow creation when no duplicate exists", async () => {
        mockPrisma.doorcard.findFirst.mockResolvedValue(null);

        const request = createRequest({
          college: "SKYLINE",
          term: "FALL",
          year: "2024",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          isDuplicate: false,
          message: "This campus and term combination is available!",
        });
      });
    });

    describe("Edge cases", () => {
      it("should handle different years correctly", async () => {
        mockPrisma.doorcard.findFirst.mockResolvedValue(null);

        const request = createRequest({
          college: "SKYLINE",
          term: "FALL",
          year: "2025",
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockPrisma.doorcard.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              year: 2025,
            }),
          })
        );
      });

      it("should handle all valid colleges", async () => {
        mockPrisma.doorcard.findFirst.mockResolvedValue(null);

        const validColleges = ["SKYLINE", "CSM", "CANADA"];

        for (const college of validColleges) {
          const request = createRequest({
            college,
            term: "FALL",
            year: "2024",
          });

          const response = await POST(request);
          expect(response.status).toBe(200);
        }

        expect(mockPrisma.doorcard.findFirst).toHaveBeenCalledTimes(
          validColleges.length
        );
      });

      it("should handle malformed JSON", async () => {
        const request = new NextRequest(
          "http://localhost:3000/api/doorcards/validate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "invalid json",
          }
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({ error: "Failed to validate doorcard" });
      });

      it("should handle database errors", async () => {
        mockPrisma.doorcard.findFirst.mockRejectedValue(
          new Error("Database error")
        );

        const request = createRequest({
          college: "SKYLINE",
          term: "FALL",
          year: "2024",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({ error: "Failed to validate doorcard" });
      });

      it("should handle missing request body", async () => {
        const request = new NextRequest(
          "http://localhost:3000/api/doorcards/validate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Validation error");
      });
    });

    describe("Integration scenarios", () => {
      it("should handle complete validation workflow with exclusion", async () => {
        // User owns doorcard-456 and wants to validate a new SKYLINE FALL 2024
        // but excluding their existing doorcard-456
        mockPrisma.doorcard.findFirst
          .mockResolvedValueOnce({ id: "doorcard-456" }) // Ownership check passes
          .mockResolvedValueOnce(null); // No other conflict

        const request = createRequest({
          college: "SKYLINE",
          term: "FALL",
          year: "2024",
          excludeDoorcardId: "doorcard-456",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.isDuplicate).toBe(false);
        expect(data.message).toBe(
          "This campus and term combination is available!"
        );

        // Should have made both database calls
        expect(mockPrisma.doorcard.findFirst).toHaveBeenCalledTimes(2);
      });

      it("should handle validation with multiple constraints", async () => {
        // Test year parsing and complex where clause
        mockPrisma.doorcard.findFirst.mockResolvedValue(null);

        const request = createRequest({
          college: "CSM",
          term: "WINTER",
          year: "2025",
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockPrisma.doorcard.findFirst).toHaveBeenCalledWith({
          where: {
            userId: "user-123",
            college: "CSM",
            term: "WINTER",
            year: 2025, // Should be parsed to integer
            isActive: true,
          },
          select: { id: true, doorcardName: true },
        });
      });
    });
  });
});
