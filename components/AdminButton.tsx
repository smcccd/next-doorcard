"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

export function AdminButton() {
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const response = await fetch("/api/user/profile");
          if (response.ok) {
            const userData = await response.json();
            setIsAdmin(userData.role === "ADMIN");
          }
        } catch (error) {
          console.error("Error checking admin role:", error);
        }
      }
    };

    checkAdminRole();
  }, [session, status]);

  // Don't render anything during SSR or if not mounted to prevent hydration issues
  if (!mounted || status === "loading" || !session) {
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Link
      href="/admin"
      className="rounded bg-red-600 px-3 py-1 text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
      prefetch={false}
    >
      Admin
    </Link>
  );
}