import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

// Mock dependencies first
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    verificationToken: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock("crypto", () => ({
  randomUUID: jest.fn(() => "mock-uuid"),
}));

// Mock the adapter before defining mockAdapter
jest.mock("@next-auth/prisma-adapter", () => ({
  PrismaAdapter: jest.fn(() => ({
    createUser: jest.fn(),
    getUser: jest.fn(),
    getUserByEmail: jest.fn(),
    getUserByAccount: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    linkAccount: jest.fn(),
    unlinkAccount: jest.fn(),
    createSession: jest.fn(),
    getSessionAndUser: jest.fn(),
    updateSession: jest.fn(),
    deleteSession: jest.fn(),
    createVerificationToken: jest.fn(),
    useVerificationToken: jest.fn(),
  })),
}));

// Store original env
const originalEnv = process.env;

// Set up test environment before importing auth
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.ONELOGIN_CLIENT_ID = "test-client-id";
process.env.ONELOGIN_CLIENT_SECRET = "test-client-secret";
process.env.ONELOGIN_ISSUER = "https://smccd.onelogin.com";
process.env.NODE_ENV = "development";

// Now import after mocks are set up
import { authOptions } from "../auth";

describe("Auth Configuration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("authOptions", () => {
    it("should have correct configuration", () => {
      expect(authOptions.providers).toHaveLength(2);
      expect(authOptions.session?.strategy).toBe("jwt");
      expect(authOptions.session?.maxAge).toBe(8 * 60 * 60); // 8 hours
      expect(authOptions.pages).toEqual({
        signIn: "/login",
        error: "/auth/error",
      });
    });

    it("should include credentials and onelogin providers", () => {
      const providerIds = authOptions.providers.map((p) => p.id);
      expect(providerIds).toContain("credentials");
      expect(providerIds).toContain("onelogin");
    });
  });

  describe.skip("Custom Prisma Adapter", () => {
    it("should handle getUserByAccount with user", async () => {
      const mockAccount = {
        User: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          image: "image.jpg",
          emailVerified: new Date("2024-01-01"),
        },
      };

      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);

      const adapter = authOptions.adapter;
      const result = await adapter?.getUserByAccount?.({
        provider: "onelogin",
        providerAccountId: "provider-123",
      });

      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: "onelogin",
            providerAccountId: "provider-123",
          },
        },
        select: { User: true },
      });

      expect(result).toEqual({
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        image: "image.jpg",
        emailVerified: new Date("2024-01-01"),
      });
    });

    it("should handle getUserByAccount without user", async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

      const adapter = authOptions.adapter;
      const result = await adapter?.getUserByAccount?.({
        provider: "onelogin",
        providerAccountId: "provider-123",
      });

      expect(result).toBeNull();
    });

    it("should handle getUserByAccount with account but no user", async () => {
      const mockAccount = {
        User: null,
      };

      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);

      const adapter = authOptions.adapter;
      const result = await adapter?.getUserByAccount?.({
        provider: "onelogin",
        providerAccountId: "provider-123",
      });

      expect(result).toBeNull();
    });

    it("should handle linkAccount", async () => {
      const mockAccountData = {
        userId: "user-123",
        type: "oauth",
        provider: "onelogin",
        providerAccountId: "provider-123",
        refresh_token: "refresh",
        access_token: "access",
        expires_at: 1234567890,
        token_type: "Bearer",
        scope: "openid profile email",
        id_token: "id-token",
        session_state: "session",
      };

      const mockCreatedAccount = {
        ...mockAccountData,
        id: "account-123",
        User: { id: "user-123" },
      };

      (prisma.account.create as jest.Mock).mockResolvedValue(
        mockCreatedAccount
      );

      const adapter = authOptions.adapter;
      const result = await adapter?.linkAccount?.(mockAccountData as any);

      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          id: "mock-uuid",
          userId: mockAccountData.userId,
          type: mockAccountData.type,
          provider: mockAccountData.provider,
          providerAccountId: mockAccountData.providerAccountId,
          refresh_token: mockAccountData.refresh_token,
          access_token: mockAccountData.access_token,
          expires_at: mockAccountData.expires_at,
          token_type: mockAccountData.token_type,
          scope: mockAccountData.scope,
          id_token: mockAccountData.id_token,
          session_state: mockAccountData.session_state,
        },
      });

      expect(result).toEqual({
        ...mockAccountData,
        id: "account-123",
      });
    });
  });

  describe.skip("Credentials Provider", () => {
    const credentialsProvider = authOptions.providers.find(
      (p) => p.id === "credentials"
    ) as any;

    it("should authenticate valid credentials", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        password: "hashed-password",
        emailVerified: new Date(),
        name: "Test User",
        role: "faculty",
        college: "SKYLINE",
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await credentialsProvider.authorize({
        email: "test@example.com",
        password: "password123",
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashed-password"
      );
      expect(result).toEqual({
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
      });
    });

    it("should reject invalid email", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await credentialsProvider.authorize({
        email: "invalid@example.com",
        password: "password123",
      });

      expect(result).toBeNull();
    });

    it("should reject invalid password", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        password: "hashed-password",
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await credentialsProvider.authorize({
        email: "test@example.com",
        password: "wrong-password",
      });

      expect(result).toBeNull();
    });

    it("should reject missing credentials", async () => {
      const result = await credentialsProvider.authorize({});
      expect(result).toBeNull();
    });

    it("should reject when bcrypt throws error", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        password: "hashed-password",
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockRejectedValue(
        new Error("Bcrypt error")
      );

      const result = await credentialsProvider.authorize({
        email: "test@example.com",
        password: "password123",
      });

      expect(result).toBeNull();
    });
  });

  describe.skip("Callbacks", () => {
    describe("jwt callback", () => {
      const jwtCallback = authOptions.callbacks?.jwt;

      it("should add user data to token on sign in", async () => {
        const token = { email: "test@example.com", sub: "user-123" };
        const user = {
          id: "user-123",
          email: "test@example.com",
          role: "faculty",
          college: "SKYLINE",
        };

        const result = await jwtCallback?.({ token, user, trigger: "signIn" });

        expect(result).toEqual({
          ...token,
          id: "user-123",
          role: "faculty",
          college: "SKYLINE",
        });
      });

      it("should handle OneLogin account creation for new user", async () => {
        const token = { email: "test@example.com", sub: "user-123" };
        const account = {
          provider: "onelogin",
          providerAccountId: "provider-123",
        };
        const profile = {
          email: "test@example.com",
          name: "Test User",
          given_name: "Test",
          family_name: "User",
          role: "staff",
          college: "CSM",
          sub: "provider-123",
        };

        (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.user.create as jest.Mock).mockResolvedValue({
          id: "new-user-123",
          email: "test@example.com",
          name: "Test User",
          firstName: "Test",
          lastName: "User",
          role: "faculty",
          college: "CSM",
          username: "test",
        });

        const result = await jwtCallback?.({
          token,
          account,
          profile,
          trigger: "signIn",
        });

        expect(prisma.user.findFirst).toHaveBeenCalledWith({
          where: {
            OR: [{ email: "test@example.com" }, { oneLoginId: "provider-123" }],
          },
        });

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: {
            email: "test@example.com",
            oneLoginId: "provider-123",
            name: "Test User",
            firstName: "Test",
            lastName: "User",
            username: "test",
            role: "faculty",
            college: "CSM",
            emailVerified: expect.any(Date),
          },
        });

        expect(result?.id).toBe("new-user-123");
        expect(result?.role).toBe("faculty");
        expect(result?.college).toBe("CSM");
      });

      it("should handle existing OneLogin user", async () => {
        const token = { email: "test@example.com", sub: "user-123" };
        const account = {
          provider: "onelogin",
          providerAccountId: "provider-123",
        };
        const profile = {
          email: "test@example.com",
          name: "Test User",
          given_name: "Test",
          family_name: "User",
          sub: "provider-123",
        };

        (prisma.user.findFirst as jest.Mock).mockResolvedValue({
          id: "existing-user-123",
          email: "test@example.com",
          role: "admin",
          college: "SKYLINE",
          username: "testuser",
        });

        const result = await jwtCallback?.({
          token,
          account,
          profile,
          trigger: "signIn",
        });

        expect(prisma.user.create).not.toHaveBeenCalled();
        expect(result?.id).toBe("existing-user-123");
        expect(result?.role).toBe("admin");
        expect(result?.college).toBe("SKYLINE");
      });

      it("should handle update trigger", async () => {
        const token = {
          id: "user-123",
          email: "test@example.com",
          role: "faculty",
          sub: "user-123",
        };
        const session = {
          user: {
            name: "Updated Name",
            college: "CSM",
          },
        };

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
          id: "user-123",
          name: "Updated Name",
          firstName: "Updated",
          lastName: "Name",
          college: "CSM",
          role: "faculty",
          username: "updated",
          displayFormat: "FULL_NAME",
          title: "Dr.",
          pronouns: "they/them",
          website: "https://example.com",
        });

        const result = await jwtCallback?.({
          token,
          session,
          trigger: "update",
        });

        expect(result?.name).toBe("Updated Name");
        expect(result?.firstName).toBe("Updated");
        expect(result?.lastName).toBe("Name");
        expect(result?.college).toBe("CSM");
        expect(result?.username).toBe("updated");
        expect(result?.displayFormat).toBe("FULL_NAME");
        expect(result?.title).toBe("Dr.");
        expect(result?.pronouns).toBe("they/them");
        expect(result?.website).toBe("https://example.com");
      });

      it("should handle update trigger when user not found", async () => {
        const token = {
          id: "user-123",
          email: "test@example.com",
          role: "faculty",
          sub: "user-123",
        };
        const session = {
          user: {
            name: "Updated Name",
          },
        };

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        const result = await jwtCallback?.({
          token,
          session,
          trigger: "update",
        });

        expect(result).toEqual(token);
      });

      it("should return token as-is for other triggers", async () => {
        const token = {
          id: "user-123",
          email: "test@example.com",
          sub: "user-123",
        };

        const result = await jwtCallback?.({ token });

        expect(result).toEqual(token);
      });
    });

    describe("session callback", () => {
      const sessionCallback = authOptions.callbacks?.session;

      it("should add token data to session", async () => {
        const session = {
          user: { email: "test@example.com" },
          expires: "2024-12-31",
        };
        const token = {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          firstName: "Test",
          lastName: "User",
          role: "faculty",
          college: "SKYLINE",
          username: "testuser",
          displayFormat: "FULL_NAME",
          title: "Dr.",
          pronouns: "they/them",
          website: "https://example.com",
          sub: "user-123",
        };

        const result = await sessionCallback?.({ session, token });

        expect(result?.user).toEqual({
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          firstName: "Test",
          lastName: "User",
          role: "faculty",
          college: "SKYLINE",
          username: "testuser",
          displayFormat: "FULL_NAME",
          title: "Dr.",
          pronouns: "they/them",
          website: "https://example.com",
        });
      });
    });

    describe("signIn callback", () => {
      const signInCallback = authOptions.callbacks?.signIn;

      it("should allow sign in with valid account", async () => {
        const user = { id: "user-123", email: "test@example.com" };
        const account = { provider: "credentials" };

        const result = await signInCallback?.({ user, account });
        expect(result).toBe(true);
      });

      it("should allow sign in without account", async () => {
        const user = { id: "user-123", email: "test@example.com" };

        const result = await signInCallback?.({ user, account: null });
        expect(result).toBe(true);
      });
    });
  });

  describe.skip("OneLogin Provider", () => {
    const oneLoginProvider = authOptions.providers.find(
      (p) => p.id === "onelogin"
    ) as any;

    it("should have correct configuration", () => {
      expect(oneLoginProvider.type).toBe("oauth");
      expect(oneLoginProvider.options.clientId).toBe("test-client-id");
      expect(oneLoginProvider.options.clientSecret).toBe("test-client-secret");
      expect(oneLoginProvider.options.issuer).toBe(
        "https://smccd.onelogin.com"
      );
    });

    it("should handle profile mapping", async () => {
      const profile = {
        sub: "onelogin-123",
        email: "test@example.com",
        name: "Test User",
        given_name: "Test",
        family_name: "User",
        role: "faculty",
        college: "SKYLINE",
      };

      const result = await oneLoginProvider.profile(profile);

      expect(result).toEqual({
        id: "onelogin-123",
        email: "test@example.com",
        name: "Test User",
        firstName: "Test",
        lastName: "User",
        role: "faculty",
        college: "SKYLINE",
      });
    });

    it("should handle profile without optional fields", async () => {
      const profile = {
        sub: "onelogin-123",
        email: "test@example.com",
      };

      const result = await oneLoginProvider.profile(profile);

      expect(result).toEqual({
        id: "onelogin-123",
        email: "test@example.com",
        name: "test@example.com",
        firstName: null,
        lastName: null,
        role: null,
        college: null,
      });
    });

    it("should handle profile with id instead of sub", async () => {
      const profile = {
        id: "onelogin-123",
        email: "test@example.com",
        name: "Test User",
      };

      const result = await oneLoginProvider.profile(profile);

      expect(result).toEqual({
        id: "onelogin-123",
        email: "test@example.com",
        name: "Test User",
        firstName: null,
        lastName: null,
        role: null,
        college: null,
      });
    });
  });

  describe.skip("Credentials Provider in Production", () => {
    it("should not include credentials provider in production", async () => {
      process.env.NODE_ENV = "production";

      // Re-import to get fresh configuration
      jest.resetModules();
      const { authOptions: prodAuthOptions } = await import("../auth");

      const credentialsProvider = prodAuthOptions.providers.find(
        (p) => p.id === "credentials"
      );

      expect(credentialsProvider).toBeUndefined();
    });
  });
});
