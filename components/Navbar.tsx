import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NavDropdown } from "./NavDropdown";
import { prisma } from "@/lib/prisma";
import SMCCDLogoFresh from "./SMCCDLogoFresh";
import MobileNav from "./MobileNav";

export default async function Navbar() {
  const session = await getServerSession(authOptions);
  const userDisplay =
    session?.user?.name || session?.user?.email || "Faculty Member";

  // Check if user is admin
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

  return (
    <nav
      className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 relative"
      aria-label="Primary"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-28 items-center justify-between">
          {/* Logo & App Branding */}
          <div className="flex items-center">
            <Link
              href="/"
              prefetch={false}
              className="flex items-center group flex-shrink-0 transition-colors duration-200 hover:opacity-90"
            >
              {/* SMCCD Logo */}
              <SMCCDLogoFresh
                height={52}
                animate={false}
                className="transition-colors duration-200 flex-shrink-0"
              />

              {/* App Branding - Clean separation */}
              <div className="mx-3 border-l border-gray-300 pl-3">
                <div className="text-xl font-semibold text-smccd-blue-900 dark:text-white transition-colors duration-200 group-hover:text-smccd-blue-700 dark:group-hover:text-smccd-blue-200">
                  Faculty Doorcard
                </div>
              </div>
            </Link>
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Right Side Navigation & Actions */}
          <div className="flex items-center space-x-6">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                href="/"
                className="text-gray-700 dark:text-gray-300 hover:text-smccd-blue-900 dark:hover:text-smccd-blue-400 hover:bg-smccd-blue-50 dark:hover:bg-smccd-blue-950/20 font-semibold text-base transition-all duration-200 px-4 py-2.5 rounded-md relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-smccd-blue-600 after:transition-all after:duration-200 hover:after:w-3/4"
              >
                Home
              </Link>
              <Link
                href="/browse"
                className="text-gray-700 dark:text-gray-300 hover:text-smccd-blue-900 dark:hover:text-smccd-blue-400 hover:bg-smccd-blue-50 dark:hover:bg-smccd-blue-950/20 font-semibold text-base transition-all duration-200 px-4 py-2.5 rounded-md relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-smccd-blue-600 after:transition-all after:duration-200 hover:after:w-3/4"
              >
                Find Faculty
              </Link>
            </div>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center">
              {session ? (
                <NavDropdown userDisplay={userDisplay} isAdmin={isAdmin} />
              ) : (
                <Link
                  href="/login"
                  className="bg-smccd-blue-900 hover:bg-smccd-blue-800 text-white px-5 py-2.5 rounded-md text-base font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-smccd-blue-700 focus:ring-offset-2"
                  prefetch={false}
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Navigation */}
            <MobileNav
              session={session}
              userDisplay={userDisplay}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
