/**
 * AUTHENTICATION PATTERNS FOR NEXT-DOORCARD
 *
 * This file provides centralized authentication functions that are more secure
 * and reliable than relying solely on middleware. Here's when to use each function:
 *
 * SERVER COMPONENTS & PAGES:
 * - Use `requireAuthUser()` for pages that require authentication
 * - Use `getOptionalAuthUser()` for public pages that show different content for logged-in users
 *
 * API ROUTES:
 * - Use `requireAuthUserAPI()` for API routes that need to return proper HTTP error responses
 * - Use `getAuthUser()` for API routes that need to handle auth failures gracefully
 *
 * CLIENT COMPONENTS:
 * - Continue using `useSession` from next-auth/react
 * - Use `clientAuthHelpers` for utility functions
 *
 * WHY THIS APPROACH IS BETTER THAN MIDDLEWARE-ONLY:
 * 1. Middleware can be bypassed in certain scenarios
 * 2. This approach provides consistent error handling
 * 3. Returns full user objects from the database
 * 4. Centralized auth logic makes it easier to maintain
 * 5. More granular control over auth behavior
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * Server-side auth function for pages that require authentication.
 * Redirects to /login if user is not authenticated.
 * Returns the full user object from the database.
 */
export async function requireAuthUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Server-side auth function for API routes that need to return JSON responses.
 * Returns null if user is not authenticated (no redirect).
 * Use this when you need to handle auth failures gracefully in API routes.
 */
export async function getAuthUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  return user;
}

/**
 * Server-side auth function for API routes that need to return error responses.
 * Returns an error object if user is not authenticated.
 * Use this in API routes where you want to return proper HTTP error responses.
 */
export async function requireAuthUserAPI() {
  const user = await getAuthUser();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }
  return { user };
}

/**
 * Server-side auth function for pages that need optional auth.
 * Returns null if user is not authenticated (no redirect).
 * Use this for public pages that show different content for logged-in users.
 */
export async function getOptionalAuthUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  return user;
}

/**
 * Client-side auth helper for use in client components.
 * This is a utility function to help with client-side auth patterns.
 * For client components, continue using useSession from next-auth/react.
 */
export const clientAuthHelpers = {
  /**
   * Check if user is authenticated on the client side
   */
  isAuthenticated: (session: any) => {
    return session?.user?.email != null;
  },

  /**
   * Get user email from session
   */
  getUserEmail: (session: any) => {
    return session?.user?.email;
  },

  /**
   * Get user ID from session
   */
  getUserId: (session: any) => {
    return session?.user?.id;
  },
};
