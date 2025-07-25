// components/Navbar.tsx (SERVER COMPONENT)
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "./SignOutButton";

export default async function Navbar() {
  const session = await getServerSession(authOptions);
  const userDisplay =
    session?.user?.name || session?.user?.email || "Faculty Member";

  return (
    <nav
      className="bg-gray-800 text-white px-6 py-4 shadow-sm"
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

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <span className="text-sm text-gray-200">
                Welcome, <span className="font-medium">{userDisplay}</span>
              </span>
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="rounded bg-blue-600 px-3 py-1 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
