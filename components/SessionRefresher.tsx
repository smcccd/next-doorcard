"use client";

import { useSessionRefresh } from "@/hooks/useSessionRefresh";

/**
 * Client component to handle session refresh on navigation
 * Prevents session from appearing to log out when using browser back button
 */
export function SessionRefresher() {
  // This hook handles all the session refresh logic
  useSessionRefresh();

  // This component doesn't render anything visible
  return null;
}
