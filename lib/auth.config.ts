import type { NextAuthConfig } from "next-auth";

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

/**
 * Auth.js v5 base configuration
 * This config is Edge Runtime compatible and used by middleware
 * The full config in auth.ts extends this with Prisma adapter
 */
export const authConfig: NextAuthConfig = {
  debug:
    process.env.NODE_ENV === "development" &&
    process.env.NEXTAUTH_DEBUG === "true",
  providers: [
    // OneLogin OIDC Provider
    {
      id: "onelogin",
      name: "SMCCD OneLogin",
      type: "oidc",
      issuer: "https://smccd.onelogin.com/oidc/2",
      clientId: process.env.ONELOGIN_CLIENT_ID!,
      clientSecret: process.env.ONELOGIN_CLIENT_SECRET!,

      profile(profile: OneLoginProfile) {
        if (process.env.NODE_ENV === "development") {
          console.debug("[Auth Config] Profile data received", {
            sub: profile.sub,
            email: profile.email,
            name: profile.name,
          });
        }

        // Ensure we have required fields
        if (!profile.sub && !profile.id) {
          throw new Error("Profile is missing required 'sub' or 'id' field");
        }

        return {
          id: profile.sub || profile.id!, // OneLogin might use 'id' instead of 'sub'
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
    updateAge: 24 * 60 * 60, // Update session only once per day
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
    // Authorized callback for middleware
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtectedRoute =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/doorcard") ||
        nextUrl.pathname.startsWith("/admin") ||
        nextUrl.pathname.startsWith("/profile");

      if (isProtectedRoute && !isLoggedIn) {
        return false; // Redirect to sign-in page
      }

      return true;
    },
  },
};
