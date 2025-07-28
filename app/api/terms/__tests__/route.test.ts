import { GET, POST } from "../route";
import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { TermManager } from "@/lib/term-management";
import { NextRequest } from "next/server";

// Mock dependencies
jest.mock("@/lib/require-auth-user");
jest.mock("@/lib/term-management");

const mockRequireAuthUserAPI = requireAuthUserAPI as jest.MockedFunction<
  typeof requireAuthUserAPI
>;
const mockTermManager = TermManager as jest.Mocked<typeof TermManager>;

describe("/api/terms", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to reduce test noise
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET", () => {
    it("should return terms for authenticated user", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const mockTerms = [
        { id: "term-1", name: "Fall 2024", season: "FALL", year: 2024 },
        { id: "term-2", name: "Spring 2025", season: "SPRING", year: 2025 },
      ];

      mockRequireAuthUserAPI.mockResolvedValue(mockUser);
      mockTermManager.getAllTerms.mockResolvedValue(mockTerms as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockTerms);
      expect(mockTermManager.getAllTerms).toHaveBeenCalled();
    });

    it("should return 401 for unauthenticated user", async () => {
      mockRequireAuthUserAPI.mockResolvedValue({
        error: "Unauthorized",
        status: 401,
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
      expect(mockTermManager.getAllTerms).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      mockRequireAuthUserAPI.mockResolvedValue(mockUser);
      mockTermManager.getAllTerms.mockRejectedValue(
        new Error("Database error"),
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch terms");
    });
  });

  describe("POST", () => {
    const mockTermData = {
      name: "Fall 2024",
      year: 2024,
      season: "FALL",
      startDate: "2024-08-26",
      endDate: "2024-12-20",
    };

    it("should create term for authenticated user", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const mockCreatedTerm = { id: "term-123", ...mockTermData };

      mockRequireAuthUserAPI.mockResolvedValue(mockUser);
      mockTermManager.createTerm.mockResolvedValue(mockCreatedTerm as any);

      const request = new NextRequest("http://localhost:3000/api/terms", {
        method: "POST",
        body: JSON.stringify(mockTermData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockCreatedTerm);
      expect(mockTermManager.createTerm).toHaveBeenCalledWith({
        ...mockTermData,
        startDate: new Date(mockTermData.startDate),
        endDate: new Date(mockTermData.endDate),
      });
    });

    it("should return 401 for unauthenticated user", async () => {
      mockRequireAuthUserAPI.mockResolvedValue({
        error: "Unauthorized",
        status: 401,
      } as any);

      const request = new NextRequest("http://localhost:3000/api/terms", {
        method: "POST",
        body: JSON.stringify(mockTermData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
      expect(mockTermManager.createTerm).not.toHaveBeenCalled();
    });

    it("should validate required fields", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      mockRequireAuthUserAPI.mockResolvedValue(mockUser);

      const incompleteData = { name: "Fall 2024" }; // Missing required fields

      const request = new NextRequest("http://localhost:3000/api/terms", {
        method: "POST",
        body: JSON.stringify(incompleteData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required fields");
      expect(mockTermManager.createTerm).not.toHaveBeenCalled();
    });

    it("should handle creation errors", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      mockRequireAuthUserAPI.mockResolvedValue(mockUser);
      mockTermManager.createTerm.mockRejectedValue(
        new Error("Creation failed"),
      );

      const request = new NextRequest("http://localhost:3000/api/terms", {
        method: "POST",
        body: JSON.stringify(mockTermData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create term");
    });

    it("should handle invalid JSON", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      mockRequireAuthUserAPI.mockResolvedValue(mockUser);

      const request = new NextRequest("http://localhost:3000/api/terms", {
        method: "POST",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create term");
    });
  });
});
