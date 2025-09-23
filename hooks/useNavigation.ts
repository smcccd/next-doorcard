"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  navigationItems,
  userMenuItems,
  externalLinks,
} from "@/lib/navigation";

export function useNavigationAuth() {
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);

  const userDisplay =
    session?.user?.name || session?.user?.email || "Faculty Member";

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
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminRole();
  }, [session, status]);

  return {
    session,
    userDisplay,
    isAdmin,
    isLoading: status === "loading" || !mounted,
    isAuthenticated: status === "authenticated" && !!session,
  };
}

export function useNavigationItems() {
  return {
    navigationItems,
    userMenuItems,
    externalLinks,
  };
}
