"use client";

import Link from "next/link";
import { useNavigationAuth } from "@/hooks/useNavigation";

export function AdminButton() {
  const { isAdmin, isLoading, isAuthenticated } = useNavigationAuth();

  // Don't render anything during loading or if not authenticated
  if (isLoading || !isAuthenticated || !isAdmin) {
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
