import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  requireAuthUser,
  getOptionalAuthUser,
  getAuthUser,
  requireAuthUserAPI,
  clientAuthHelpers,
} from "../require-auth-user";

// Mock dependencies
jest.mock("next-auth/next");
jest.mock("next/navigation");
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
const mockPrismaUserFindUnique = prisma.user.findUnique as jest.MockedFunction<
  typeof prisma.user.findUnique
>;

describe("require-auth-user utilities", () => {
  const mockUser = {
    id: "user-123",
    email: "test@smccd.edu",
    name: "Test User",
    role: "FACULTY",
    college: "SKYLINE",
  };

  const mockSession = {
    user: {
      email: "test@smccd.edu",
      name: "Test User",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("requireAuthUser", () => {
    it("should return user when authenticated", async () => {
      mockGetServerSession.mockResolvedValueOnce(mockSession);
      mockPrismaUserFindUnique.mockResolvedValueOnce(mockUser);

      const result = await requireAuthUser();

      expect(result).toEqual(mockUser);
      expect(mockGetServerSession).toHaveBeenCalledTimes(1);
      expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
        where: { email: "test@smccd.edu" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          college: true,
        },
      });
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("should redirect when no session", async () => {
      mockGetServerSession.mockResolvedValueOnce(null);

      await requireAuthUser();

      expect(mockRedirect).toHaveBeenCalledWith("/login");
      expect(mockPrismaUserFindUnique).not.toHaveBeenCalled();
    });

    it("should redirect when session has no email", async () => {
      mockGetServerSession.mockResolvedValueOnce({ user: {} });

      await requireAuthUser();

      expect(mockRedirect).toHaveBeenCalledWith("/login");
      expect(mockPrismaUserFindUnique).not.toHaveBeenCalled();
    });

    it("should redirect when user not found in database", async () => {
      mockGetServerSession.mockResolvedValueOnce(mockSession);
      mockPrismaUserFindUnique.mockResolvedValueOnce(null);

      await requireAuthUser();

      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });
  });

  describe("getOptionalAuthUser", () => {
    it("should return user when authenticated", async () => {
      mockGetServerSession.mockResolvedValueOnce(mockSession);
      mockPrismaUserFindUnique.mockResolvedValueOnce(mockUser);

      const result = await getOptionalAuthUser();

      expect(result).toEqual(mockUser);
    });

    it("should return null when not authenticated", async () => {
      mockGetServerSession.mockResolvedValueOnce(null);

      const result = await getOptionalAuthUser();

      expect(result).toBeNull();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("should return null when user not in database", async () => {
      mockGetServerSession.mockResolvedValueOnce(mockSession);
      mockPrismaUserFindUnique.mockResolvedValueOnce(null);

      const result = await getOptionalAuthUser();

      expect(result).toBeNull();
    });
  });

  describe("getAuthUser", () => {
    it("should return user when authenticated", async () => {
      mockGetServerSession.mockResolvedValueOnce(mockSession);
      mockPrismaUserFindUnique.mockResolvedValueOnce(mockUser);

      const result = await getAuthUser();

      expect(result).toEqual(mockUser);
    });

    it("should return null when not authenticated", async () => {
      mockGetServerSession.mockResolvedValueOnce(null);

      const result = await getAuthUser();

      expect(result).toBeNull();
    });
  });

  describe("requireAuthUserAPI", () => {
    it("should return user object when authenticated", async () => {
      mockGetServerSession.mockResolvedValueOnce(mockSession);
      mockPrismaUserFindUnique.mockResolvedValueOnce(mockUser);

      const result = await requireAuthUserAPI();

      expect(result).toEqual({ user: mockUser });
      expect("error" in result).toBe(false);
    });

    it("should return error object when not authenticated", async () => {
      mockGetServerSession.mockResolvedValueOnce(null);

      const result = await requireAuthUserAPI();

      expect(result).toEqual({ error: "Unauthorized", status: 401 });
      expect("user" in result).toBe(false);
    });

    it("should return error when user not found", async () => {
      mockGetServerSession.mockResolvedValueOnce(mockSession);
      mockPrismaUserFindUnique.mockResolvedValueOnce(null);

      const result = await requireAuthUserAPI();

      expect(result).toEqual({ error: "Unauthorized", status: 401 });
    });
  });

  describe("clientAuthHelpers", () => {
    describe("isAuthenticated", () => {
      it("should return true for valid session", () => {
        const session = { user: { email: "test@example.com", id: "123" } };
        expect(clientAuthHelpers.isAuthenticated(session)).toBe(true);
      });

      it("should return false for null session", () => {
        expect(clientAuthHelpers.isAuthenticated(null)).toBe(false);
      });

      it("should return false for undefined session", () => {
        expect(clientAuthHelpers.isAuthenticated(undefined)).toBe(false);
      });

      it("should return false for session without email", () => {
        const session = { user: { id: "123" } };
        expect(clientAuthHelpers.isAuthenticated(session as any)).toBe(false);
      });

      it("should return false for session without user", () => {
        const session = {};
        expect(clientAuthHelpers.isAuthenticated(session as any)).toBe(false);
      });
    });

    describe("getUserEmail", () => {
      it("should return email for valid session", () => {
        const session = { user: { email: "test@example.com", id: "123" } };
        expect(clientAuthHelpers.getUserEmail(session)).toBe("test@example.com");
      });

      it("should return undefined for null session", () => {
        expect(clientAuthHelpers.getUserEmail(null)).toBeUndefined();
      });

      it("should return undefined for session without email", () => {
        const session = { user: { id: "123" } };
        expect(clientAuthHelpers.getUserEmail(session as any)).toBeUndefined();
      });
    });

    describe("getUserId", () => {
      it("should return id for valid session", () => {
        const session = { user: { email: "test@example.com", id: "123" } };
        expect(clientAuthHelpers.getUserId(session)).toBe("123");
      });

      it("should return undefined for null session", () => {
        expect(clientAuthHelpers.getUserId(null)).toBeUndefined();
      });

      it("should return undefined for session without id", () => {
        const session = { user: { email: "test@example.com" } };
        expect(clientAuthHelpers.getUserId(session as any)).toBeUndefined();
      });
    });
  });

  describe("error handling", () => {
    it("should handle database errors gracefully", async () => {
      mockGetServerSession.mockResolvedValueOnce(mockSession);
      mockPrismaUserFindUnique.mockRejectedValueOnce(new Error("Database error"));

      await expect(requireAuthUser()).rejects.toThrow("Database error");
    });

    it("should handle session errors gracefully", async () => {
      mockGetServerSession.mockRejectedValueOnce(new Error("Session error"));

      await expect(requireAuthUser()).rejects.toThrow("Session error");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string email", async () => {
      mockGetServerSession.mockResolvedValueOnce({ user: { email: "" } });

      const result = await getOptionalAuthUser();

      expect(result).toBeNull();
      expect(mockPrismaUserFindUnique).not.toHaveBeenCalled();
    });

    it("should handle whitespace-only email", async () => {
      mockGetServerSession.mockResolvedValueOnce({ user: { email: "   " } });

      const result = await getOptionalAuthUser();

      expect(result).toBeNull();
    });

    it("should handle malformed session object", async () => {
      mockGetServerSession.mockResolvedValueOnce({ user: null });

      const result = await getOptionalAuthUser();

      expect(result).toBeNull();
    });
  });
});