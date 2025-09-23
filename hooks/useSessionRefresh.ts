"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { debounce } from "@/lib/debounce";

/**
 * Hook to handle session issues with browser navigation
 * Based on research, the main issue is Next.js Router Cache serving stale content
 * after logout when using browser back button
 */
export function useSessionRefresh() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const lastStatus = useRef(status);

  // Debounced refresh to prevent excessive calls (300ms delay)
  const debouncedRefresh = useCallback(
    debounce(() => router.refresh(), 300),
    [router]
  );

  useEffect(() => {
    // Detect when user becomes unauthenticated (logout)
    if (
      lastStatus.current === "authenticated" &&
      status === "unauthenticated"
    ) {
      // Clear Next.js Router Cache to prevent back button showing cached protected content
      debouncedRefresh();
    }
    lastStatus.current = status;
  }, [status, debouncedRefresh]);

  // Handle browser back/forward navigation for protected routes
  useEffect(() => {
    const protectedPaths = ["/dashboard", "/doorcard", "/admin", "/profile"];

    const handlePopState = () => {
      // Only refresh if navigating to a protected route while unauthenticated
      const isProtectedPath = protectedPaths.some((path) =>
        window.location.pathname.startsWith(path)
      );

      if (status === "unauthenticated" && isProtectedPath) {
        debouncedRefresh();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [status, debouncedRefresh]);

  return { session, status };
}
