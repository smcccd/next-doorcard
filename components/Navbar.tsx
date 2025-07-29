import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NavDropdown } from "./NavDropdown";
import { prisma } from "@/lib/prisma";
import SMCCDLogo from "./SMCCDLogo";

const navLinks = [
  { href: "https://smccd.edu/", text: "Home" },
  { href: "https://smccd.edu/aboutus/", text: "About Us" },
  { href: "https://smccd.edu/boardoftrustees/", text: "Board of Trustees" },
  { href: "https://smccd.edu/departments/", text: "Departments" },
  { href: "https://jobs.smccd.edu/", text: "Employment" },
  { href: "http://foundation.smccd.edu", text: "Foundation" },
  { href: "https://smccd.edu/aboutus/contactus.php", text: "Contact Us" },
];

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
      className="bg-gray-800 dark:bg-gray-950 text-white px-4 sm:px-6 py-3 sm:py-4 lg:py-2 shadow-lg border-b border-gray-700 dark:border-gray-800"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center">
        <Link
          href="/"
          prefetch={false}
          className="flex items-center justify-center gap-2 sm:gap-3 group"
        >
          <div className="flex-shrink-0">
            <SMCCDLogo
              height={42}
              color="#FFFFFF"
              animate={true}
              className="transition duration-300"
            />
          </div>
          <div className="text-sm sm:text-base md:text-lg font-heading font-bold tracking-wide text-white/90 group-hover:text-white transition-colors duration-300">
            Faculty Doorcard
          </div>
        </Link>

        <div className="hidden lg:flex flex-1 items-center justify-center gap-x-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium whitespace-nowrap relative group"
            >
              {link.text}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-200 group-hover:w-full"></span>
            </a>
          ))}
        </div>

        <div className="flex flex-shrink-0 items-center gap-4">
          {session ? (
            <NavDropdown userDisplay={userDisplay} isAdmin={isAdmin} />
          ) : (
            <Link
              href="/login"
              className="rounded bg-blue-500 px-3 py-1 text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              prefetch={false}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
