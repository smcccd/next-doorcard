// components/Navbar.tsx (SERVER COMPONENT)
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NavDropdown } from "./NavDropdown";
import { prisma } from "@/lib/prisma";

const navLinks = [
  { href: "//smccd.edu/", text: "Home" },
  { href: "//smccd.edu/aboutus/", text: "About Us" },
  { href: "//smccd.edu/boardoftrustees/", text: "Board of Trustees" },
  { href: "//smccd.edu/departments/", text: "Departments" },
  { href: "https://jobs.smccd.edu/", text: "Employment" },
  { href: "http://foundation.smccd.edu", text: "Foundation" },
  { href: "//smccd.edu/aboutus/contactus.php", text: "Contact Us" },
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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-4" prefetch={false}>
            <Image
              src="/smccd-logo-white.svg"
              alt="San Mateo County Community College District"
              width={180}
              height={60}
              priority
              className="h-auto w-[180px]"
            />
            <span className="text-xl font-semibold tracking-tight">
              Faculty Doorcard
            </span>
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
            >
              {link.text}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <NavDropdown userDisplay={userDisplay} isAdmin={isAdmin} />
          ) : (
            <Link
              href="/login"
              className="rounded bg-blue-500 px-3 py-1 text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              prefetch={false}
            >
              Faculty Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
