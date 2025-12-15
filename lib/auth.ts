import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { authConfig } from "./auth.config";

// Use Web Crypto API for Edge Runtime compatibility
function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Custom PrismaAdapter that handles PascalCase relations and ID generation
function CustomPrismaAdapter(): Adapter {
  const baseAdapter = PrismaAdapter(prisma);

  return {
    ...baseAdapter,
    async createUser(user): Promise<AdapterUser> {
      logger.debug("[ADAPTER] createUser called", {
        email: user.email,
        name: user.name,
      });
      try {
        const result = await prisma.user.create({
          data: {
            id: generateUUID(), // Generate ID for our schema
            name: user.name,
            email: user.email!,
            image: user.image,
            emailVerified: user.emailVerified,
            updatedAt: new Date(), // Required field in our schema
            // Add custom fields with defaults
            role: "FACULTY",
            college: null,
          },
        });
        logger.debug("[ADAPTER] createUser success", { userId: result.id });
        // Return only AdapterUser fields
        return {
          id: result.id,
          email: result.email,
          name: result.name,
          image: result.image,
          emailVerified: result.emailVerified,
        };
      } catch (error) {
        logger.error("[ADAPTER] createUser failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        select: { User: true },
      });

      if (!account?.User) {
        return null;
      }

      // Transform Prisma User to AdapterUser
      const user = account.User;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
      };
    },
    async linkAccount(account): Promise<void> {
      logger.debug("[ADAPTER] linkAccount called", {
        provider: account.provider,
        userId: account.userId,
        type: account.type,
      });

      try {
        await prisma.account.create({
          data: {
            id: generateUUID(),
            userId: account.userId,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refresh_token: account.refresh_token ?? undefined,
            access_token: account.access_token ?? undefined,
            expires_at: account.expires_at ?? undefined,
            token_type: account.token_type ?? undefined,
            scope: account.scope ?? undefined,
            id_token: account.id_token ?? undefined,
            session_state: account.session_state?.toString() ?? undefined,
          },
        });
        logger.debug("[ADAPTER] linkAccount success");
      } catch (error) {
        logger.error("[ADAPTER] linkAccount failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    },
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: CustomPrismaAdapter(),
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      logger.debug("[SIGNIN] Callback triggered", {
        provider: account?.provider,
        userEmail: user?.email,
        accountType: account?.type,
      });

      // Skip database operations in test environment to avoid timeouts
      if (process.env.NODE_ENV === "test" || process.env.CYPRESS) {
        return true;
      }

      // Allow OneLogin authentication - let Prisma adapter handle user/account creation
      if (account?.provider === "onelogin") {
        logger.debug("[SIGNIN] OneLogin authentication successful", {
          email: user?.email,
          name: user?.name,
        });
        return true; // Let Prisma adapter handle everything
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.college = (user as any).college;
      }

      // Skip database queries in test environment to avoid timeouts
      if (process.env.NODE_ENV === "test" || process.env.CYPRESS) {
        // Use default values for test users
        token.role = token.role || "FACULTY";
        token.college = token.college || "SKYLINE";
        return token;
      }

      // Fetch user details if not in token
      if (token.id && !token.role) {
        try {
          const userDetails = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, college: true },
          });
          if (userDetails) {
            token.role = userDetails.role;
            token.college = userDetails.college || undefined;
          }
        } catch (error) {
          logger.error("Error fetching user details", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return token;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      if (isNewUser) {
        logger.info("New user signed in", {
          email: user.email,
          provider: account?.provider,
        });
      }
    },
  },
});

// Type augmentation for custom session properties
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare module "next-auth" {
  interface User {
    role?: string;
    college?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    college?: string;
  }
}
