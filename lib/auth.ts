import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Adapter, AdapterAccount } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { logger } from "@/lib/logger";

// OneLogin profile interface
interface OneLoginProfile {
  sub?: string;
  id?: string;
  name?: string;
  email: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  role?: string;
  college?: string;
  department?: string;
}

// Custom PrismaAdapter that handles PascalCase relations and ID generation
function CustomPrismaAdapter(): Adapter {
  const baseAdapter = PrismaAdapter(prisma);

  return {
    ...baseAdapter,
    async createUser(user: any) {
      logger.debug("[ADAPTER] createUser called", {
        email: user.email,
        name: user.name,
      });
      try {
        const result = await prisma.user.create({
          data: {
            id: crypto.randomUUID(), // Generate ID for our schema
            name: user.name,
            email: user.email,
            image: user.image,
            emailVerified: user.emailVerified,
            updatedAt: new Date(), // Required field in our schema
            // Add custom fields with defaults
            role: "FACULTY",
            college: null,
          },
        });
        logger.debug("[ADAPTER] createUser success", { userId: result.id });
        return result;
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
    async linkAccount(account: AdapterAccount) {
      logger.debug("[ADAPTER] linkAccount called", {
        provider: account.provider,
        userId: account.userId,
        type: account.type,
      });

      try {
        const result = await prisma.account.create({
          data: {
            id: crypto.randomUUID(),
            userId: account.userId,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state,
          },
        });
        logger.debug("[ADAPTER] linkAccount success", { accountId: result.id });
        return result;
      } catch (error) {
        logger.error("[ADAPTER] linkAccount failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    },
  };
}

export const authOptions: NextAuthOptions = {
  debug:
    process.env.NODE_ENV === "development" &&
    process.env.NEXTAUTH_DEBUG === "true",
  adapter: CustomPrismaAdapter(),
  providers: [
    // OneLogin OIDC Provider - Custom OAuth Configuration
    {
      id: "onelogin",
      name: "SMCCD OneLogin",
      type: "oauth",
      clientId: process.env.ONELOGIN_CLIENT_ID!,
      clientSecret: process.env.ONELOGIN_CLIENT_SECRET!,

      authorization: {
        url: "https://smccd.onelogin.com/oidc/2/auth",
        params: {
          scope: "openid profile email",
          response_type: "code",
        },
      },
      token: {
        url: "https://smccd.onelogin.com/oidc/2/token",
        async request(context) {
          const { params, provider } = context;

          // Get client credentials from the provider config
          const clientId = process.env.ONELOGIN_CLIENT_ID!;
          const clientSecret = process.env.ONELOGIN_CLIENT_SECRET!;

          // Try Basic Authentication (common OIDC method)
          const baseUrl =
            process.env.NEXTAUTH_URL ||
            (process.env.NODE_ENV === "production"
              ? "https://doorcard.vercel.app"
              : "http://localhost:3000");
          const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/callback/onelogin`;
          const tokenParams = new URLSearchParams({
            grant_type: "authorization_code",
            code: params.code || "",
            redirect_uri: redirectUri,
          });

          const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
            "base64"
          );

          logger.debug("Token request initiated", {
            grant_type: "authorization_code",
            auth_method: "Basic",
            client_id: clientId,
          });

          const tokenUrl =
            typeof provider.token === "string"
              ? provider.token
              : provider.token?.url || "";
          const response = await fetch(tokenUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${basicAuth}`,
            },
            body: tokenParams,
          });

          const tokens = await response.json();
          logger.debug("Token response received", {
            status: response.status,
            hasAccessToken: !!tokens.access_token,
            hasRefreshToken: !!tokens.refresh_token,
            tokenType: tokens.token_type,
          });

          if (!response.ok) {
            throw new Error(
              `Token request failed: ${response.status} ${JSON.stringify(tokens)}`
            );
          }

          return { tokens };
        },
      },
      userinfo: {
        url: "https://smccd.onelogin.com/oidc/2/me",
        async request({ tokens, provider }) {
          logger.debug("Fetching UserInfo with access token");

          const userinfoUrl =
            typeof provider.userinfo === "string"
              ? provider.userinfo
              : provider.userinfo?.url || "";
          const response = await fetch(userinfoUrl, {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          });

          const userInfo = await response.json();
          logger.debug("UserInfo response received", {
            status: response.status,
            hasUserInfo: !!userInfo,
            userEmail: userInfo?.email,
          });

          if (!response.ok) {
            throw new Error(
              `UserInfo request failed: ${response.status} ${JSON.stringify(userInfo)}`
            );
          }

          return userInfo;
        },
      },

      profile(profile) {
        logger.debug("Profile data received", {
          sub: profile.sub,
          email: profile.email,
          name: profile.name,
        });

        // Ensure we have required fields
        if (!profile.sub && !profile.id) {
          throw new Error("Profile is missing required 'sub' or 'id' field");
        }

        return {
          id: profile.sub || profile.id, // OneLogin might use 'id' instead of 'sub'
          name:
            profile.name ||
            `${profile.given_name || ""} ${profile.family_name || ""}`.trim() ||
            profile.email,
          email: profile.email,
          image: profile.picture,
          // Map OneLogin attributes to our user model
          role: profile.role || "FACULTY", // Default role
          college: profile.college || profile.department,
        };
      },
    },
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours for production
    updateAge: 24 * 60 * 60, // Update session only once per day (best practice to reduce server load)
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 8 * 60 * 60, // Match session.maxAge
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
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
          name: user?.name 
        });
        return true; // Let Prisma adapter handle everything
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.college = user.college;
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
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.college = token.college as string;
      }
      return session;
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
};
