import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

interface SessionWithId extends Session {
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
}

/**
 * Columns we need from User. Selecting avoids requesting removed columns.
 */
const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  college: true,
} as const;

type SelectedUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  college: string | null;
};

async function fetchSessionUser(): Promise<SelectedUser | null> {
  // ONLY allow Cypress bypass in non-production environments
  // This prevents authentication bypass in production
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.CYPRESS === "true"
  ) {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const sessionToken =
        cookieStore.get("next-auth.session-token")?.value ||
        cookieStore.get("__Secure-next-auth.session-token")?.value;

      if (sessionToken) {
        console.log(
          "[DEBUG] Cypress detected with session token in test environment, returning mock user"
        );
        return {
          id: "test-besnyib-smccd-edu",
          email: "besnyib@smccd.edu",
          name: "Test User",
          role: "ADMIN",
          college: "SKYLINE",
        };
      }
    } catch (error) {
      // cookies() called outside request scope - ignore in tests
      console.log(
        "[DEBUG] cookies() not available, continuing with normal auth"
      );
    }
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !session.user.email.trim()) return null;

  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: userSelect,
  }) as Promise<SelectedUser | null>;
}

/* -------------------------------------------------------------------------- */
/* Page / RSC helpers                                                         */
/* -------------------------------------------------------------------------- */

export async function requireAuthUser(): Promise<SelectedUser> {
  const user = await fetchSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function getOptionalAuthUser(): Promise<SelectedUser | null> {
  return fetchSessionUser();
}

/* -------------------------------------------------------------------------- */
/* API helpers                                                                */
/* -------------------------------------------------------------------------- */

export async function getAuthUser(): Promise<SelectedUser | null> {
  return fetchSessionUser();
}

export async function requireAuthUserAPI(): Promise<
  { user: SelectedUser } | { error: string; status: number }
> {
  const user = await fetchSessionUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  return { user };
}

/* -------------------------------------------------------------------------- */
/* Client convenience helpers                                                 */
/* -------------------------------------------------------------------------- */

export const clientAuthHelpers = {
  isAuthenticated(session: SessionWithId | null | undefined): boolean {
    return Boolean(session?.user?.email);
  },
  getUserEmail(session: SessionWithId | null | undefined): string | undefined {
    return session?.user?.email ?? undefined;
  },
  getUserId(session: SessionWithId | null | undefined): string | undefined {
    return session?.user?.id ?? undefined;
  },
};
