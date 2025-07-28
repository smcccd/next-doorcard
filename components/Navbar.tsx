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
      className="bg-gray-800 dark:bg-gray-950 text-white px-6 py-4 shadow-sm"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex flex-shrink-0 items-center justify-center gap-4">
          <Link href="/" className="group block" prefetch={false}>
            <div className="flex flex-col items-center transition-all duration-700 group-hover:scale-110 group-hover:-translate-y-1">
              <div className="transition-all duration-700 group-hover:drop-shadow-2xl group-hover:rotate-2 group-hover:scale-110">
                <SMCCDLogo
                  height={45}
                  className="w-[160px] sm:w-[180px] transition-all duration-700 group-hover:brightness-125 group-hover:scale-110 animate-pulse hover:animate-spin"
                />
              </div>
              <div className="text-base font-semibold sm:text-lg font-heading transition-all duration-700 group-hover:text-blue-300 tracking-widest -ml-8 sm:-ml-10 group-hover:tracking-wider group-hover:scale-110 animate-bounce hover:animate-ping">
                Faculty Doorcard
              </div>
              <div className="w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-700 group-hover:w-full group-hover:h-1 rounded-full opacity-0 group-hover:opacity-100"></div>
            </div>
          </Link>
        </div>

        <div className="hidden lg:flex flex-1 items-center justify-center gap-x-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors text-md font-medium whitespace-nowrap"
            >
              {link.text}
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
