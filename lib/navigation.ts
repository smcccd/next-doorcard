import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Navigation configuration
export const navigationItems: Array<{
  href: string;
  label: string;
  ariaLabel: string;
}> = [];

export const externalLinks = [
  { href: "https://smccd.edu/", text: "Home" },
  { href: "https://smccd.edu/aboutus/", text: "About Us" },
  { href: "https://smccd.edu/boardoftrustees/", text: "Board of Trustees" },
  { href: "https://smccd.edu/departments/", text: "Departments" },
  { href: "https://jobs.smccd.edu/", text: "Employment" },
  { href: "http://foundation.smccd.edu", text: "Foundation" },
  { href: "https://smccd.edu/aboutus/contactus.php", text: "Contact Us" },
] as const;

export const userMenuItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard",
  },
  {
    href: "/profile",
    label: "Profile",
    icon: "User",
  },
  {
    href: "/docs",
    label: "Help",
    icon: "HelpCircle",
  },
] as const;

// Shared authentication and admin checking logic
export async function getNavigationAuth() {
  const session = await auth();
  const userDisplay =
    session?.user?.name || session?.user?.email || "Faculty Member";

  let isAdmin = false;
  if (session?.user?.email) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true },
      });
      isAdmin = user?.role === "ADMIN";
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  }

  return {
    session,
    userDisplay,
    isAdmin,
  };
}

// Shared styling configurations
export const navStyles = {
  // Link styles
  navLink: {
    base: "font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-smccd-blue-500 focus:ring-offset-2",
    desktop:
      "text-gray-700 dark:text-gray-300 hover:text-smccd-blue-900 dark:hover:text-smccd-blue-400 hover:bg-smccd-blue-50 dark:hover:bg-smccd-blue-950/20 px-4 py-2.5 rounded-md",
    mobile:
      "block px-4 py-3 text-base text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium",
    underlineEffect:
      "relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-smccd-blue-600 after:transition-all after:duration-200 hover:after:w-3/4",
  },

  // Button styles
  loginButton: {
    base: "bg-smccd-blue-900 hover:bg-smccd-blue-800 text-white font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-smccd-blue-700 focus:ring-offset-2",
    desktop: "px-5 py-2.5 rounded-md text-base",
    mobile: "block px-4 py-3 text-base font-medium",
  },

  // Container styles
  container: {
    nav: "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700",
    wrapper: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
    flex: "flex items-center justify-between",
  },
} as const;

// Type definitions
export type NavigationAuth = Awaited<ReturnType<typeof getNavigationAuth>>;
export type NavigationItem = (typeof navigationItems)[number];
export type ExternalLink = (typeof externalLinks)[number];
export type UserMenuItem = (typeof userMenuItems)[number];
