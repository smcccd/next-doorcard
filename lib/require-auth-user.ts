import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

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
