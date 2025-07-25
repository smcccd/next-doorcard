// components/SignOutButton.tsx (CLIENT COMPONENT)
"use client";

import { signOut } from "next-auth/react";
import { useTransition } from "react";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(() => {
          // callbackUrl ensures redirect to landing page
          signOut({ callbackUrl: "/" });
        })
      }
      disabled={isPending}
      className="rounded bg-red-600 px-3 py-1 text-sm font-medium transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-400"
    >
      {isPending ? "Signing out…" : "Logout"}
    </button>
  );
}
