import { NextRequest } from "next/server";
import { GET, PATCH } from "../route";
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
      update: jest.fn(),
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

describe("User Profile API Route", () => {
  const mockUser = {
    id: "user-123",
    name: "Test User",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    username: "testuser",
    title: "Dr.",
    pronouns: "they/them",
    displayFormat: "FULL_NAME",
    college: "SKYLINE",
    website: "https://example.com",
    role: "FACULTY",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Suppress console.log output in tests
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/user/profile", () => {
    it("should return user profile when authenticated", async () => {
      const mockSession = {
        user: { email: "test@example.com" },
      };
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const request = new NextRequest("http://localhost:3000/api/user/profile");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          title: true,
          pronouns: true,
          displayFormat: true,
          email: true,
          username: true,
          website: true,
          college: true,
          role: true,
        },
      });
    });

    it("should return 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/user/profile");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("should return 401 when session has no email", async () => {
      const mockSession = {
        user: { id: "user-123" }, // No email
      };
      mockGetServerSession.mockResolvedValue(mockSession);

      const request = new NextRequest("http://localhost:3000/api/user/profile");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 when user not found", async () => {
      const mockSession = {
        user: { email: "nonexistent@example.com" },
      };
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/user/profile");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "User not found" });
    });

    it("should return 500 on database error", async () => {
      const mockSession = {
        user: { email: "test@example.com" },
      };
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost:3000/api/user/profile");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to fetch profile" });
    });
  });

  describe("PATCH /api/user/profile", () => {
    const mockSession = {
      user: { email: "test@example.com" },
    };

    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession);
    });

    it("should update profile with new firstName/lastName format", async () => {
      const updateData = {
        firstName: "Updated",
        lastName: "Name",
        title: "Prof.",
        pronouns: "she/her",
        displayFormat: "FIRST_LAST",
        college: "CSM",
        website: "https://updated.com",
      };

      const updatedUser = {
        ...mockUser,
        ...updateData,
        name: "Updated Name",
      };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const request = new NextRequest(
        "http://localhost:3000/api/user/profile",
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(updatedUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        data: {
          firstName: "Updated",
          lastName: "Name",
          name: "Updated Name",
          title: "Prof.",
          pronouns: "she/her",
          displayFormat: "FIRST_LAST",
          college: "CSM",
          website: "https://updated.com",
        },
        select: expect.any(Object),
      });
    });

    it("should update profile with legacy name format", async () => {
      const updateData = {
        name: "Legacy Name Format",
        college: "CANADA",
      };

      const updatedUser = {
        ...mockUser,
        name: "Legacy Name Format",
        college: "CANADA",
      };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const request = new NextRequest(
        "http://localhost:3000/api/user/profile",
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        data: {
          name: "Legacy Name Format",
          college: "CANADA",
          website: null,
        },
        select: expect.any(Object),
      });
    });

    it("should handle valid website URLs", async () => {
      const testCases = [
        "https://example.com",
        "http://example.com",
        "example.com",
      ];

      for (const website of testCases) {
        jest.clearAllMocks();
        mockGetServerSession.mockResolvedValue(mockSession);
        mockPrisma.user.update.mockResolvedValue({ ...mockUser, website });

        const request = new NextRequest(
          "http://localhost:3000/api/user/profile",
          {
            method: "PATCH",
            body: JSON.stringify({
              firstName: "Test",
              lastName: "User",
              website,
            }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await PATCH(request);

        expect(response.status).toBe(200);
        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              website,
            }),
          })
        );
      }
    });

    it("should reject URLs with leading/trailing whitespace (validation before trim)", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/user/profile",
        {
          method: "PATCH",
          body: JSON.stringify({
            firstName: "Test",
            lastName: "User",
            website: "  https://example.com  ", // Has spaces, should fail validation
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Invalid website URL" });
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should handle empty website string", async () => {
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, website: null });

      const request = new NextRequest(
        "http://localhost:3000/api/user/profile",
        {
          method: "PATCH",
          body: JSON.stringify({
            firstName: "Test",
            lastName: "User",
            website: "", // Empty string should become null
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            website: null,
          }),
        })
      );
    });

    it("should validate websites by trying https prefix", async () => {
      // Test that the validation logic works correctly
      const validWebsites = [
        "google.com",
        "subdomain.example.org",
        "site-with-dashes.com",
      ];

      for (const website of validWebsites) {
        jest.clearAllMocks();
        mockGetServerSession.mockResolvedValue(mockSession);
        mockPrisma.user.update.mockResolvedValue({ ...mockUser, website });

        const request = new NextRequest(
          "http://localhost:3000/api/user/profile",
          {
            method: "PATCH",
            body: JSON.stringify({
              firstName: "Test",
              lastName: "User",
              website,
            }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await PATCH(request);

        expect(response.status).toBe(200);
      }
    });

    it("should return 400 for invalid website URL", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/user/profile",
        {
          method: "PATCH",
          body: JSON.stringify({
            firstName: "Test",
            lastName: "User",
            website: "not a valid url with spaces",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Invalid website URL" });
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should return 400 when neither name formats provided", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/user/profile",
        {
          method: "PATCH",
          body: JSON.stringify({
            college: "SKYLINE",
            // No name, firstName, or lastName
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: "Either firstName/lastName or name is required",
      });
    });

    it("should return 400 when empty name provided", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/user/profile",
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "   ", // Whitespace only
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: "Either firstName/lastName or name is required",
      });
    });

    it("should handle title and pronouns with 'none' values", async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const request = new NextRequest(
        "http://localhost:3000/api/user/profile",
        {
          method: "PATCH",
          body: JSON.stringify({
            firstName: "Test",
            lastName: "User",
            title: "none",
            pronouns: "none",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: null,
            pronouns: null,
          }),
        })
      );
    });

    it("should handle college with 'none' value", async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const request = new NextRequest(
        "http://localhost:3000/api/user/profile",
        {
          method: "PATCH",
          body: JSON.stringify({
            firstName: "Test",
            lastName: "User",
            college: "none",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            college: null,
          }),
        })
      );
    });

    it("should validate college values", async () => {
      const validColleges = ["SKYLINE", "CSM", "CANADA"];

      for (const college of validColleges) {
        jest.clearAllMocks();
        mockGetServerSession.mockResolvedValue(mockSession);
        mockPrisma.user.update.mockResolvedValue({ ...mockUser, college });

        const request = new NextRequest(
          "http://localhost:3000/api/user/profile",
          {
            method: "PATCH",
            body: JSON.stringify({
              firstName: "Test",
              lastName: "User",
              college,
            }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await PATCH(request);

        expect(response.status).toBe(200);
        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              college,
            }),
          })
        );
      }
    });

    it("should ignore invalid college values", async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const request = new NextRequest(
        "http://localhost:3000/api/user/profile",
        {
          method: "PATCH",
          body: JSON.stringify({
            firstName: "Test",
            lastName: "User",
            college: "INVALID_COLLEGE",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            college: "INVALID_COLLEGE",
          }),
        })
      );
    });

    it("should return 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/user/profile",
        {
          method: "PATCH",
          body: JSON.stringify({ name: "Test" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 500 on database error", async () => {
      mockPrisma.user.update.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest(
        "http://localhost:3000/api/user/profile",
        {
          method: "PATCH",
          body: JSON.stringify({
            firstName: "Test",
            lastName: "User",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to update profile" });
    });

    it("should handle malformed JSON", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/user/profile",
        {
          method: "PATCH",
          body: "invalid json",
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to update profile" });
    });

    it("should use default displayFormat when not provided", async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const request = new NextRequest(
        "http://localhost:3000/api/user/profile",
        {
          method: "PATCH",
          body: JSON.stringify({
            firstName: "Test",
            lastName: "User",
            // No displayFormat provided
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            displayFormat: "FULL_NAME",
          }),
        })
      );
    });
  });
});
