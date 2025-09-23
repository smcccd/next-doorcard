"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import type { Session } from "next-auth";

export default function AuthProvider({
  children,
  session,
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  return (
    <SessionProvider
      session={session}
      // Avoid aggressive refetching - only refetch on window focus
      refetchOnWindowFocus={true} // This is actually the default
      // Don't use refetchInterval unless you have a specific need
      // It causes unnecessary server load and can create race conditions
    >
      {children}
    </SessionProvider>
  );
}
