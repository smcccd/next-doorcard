"use client";

import Link from "next/link";
import {
  ChevronDown,
  User,
  HelpCircle,
  LogOut,
  Settings,
  Menu,
  LayoutDashboard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

interface NavDropdownProps {
  userDisplay: string;
  isAdmin?: boolean;
}

export function NavDropdown({
  userDisplay,
  isAdmin = false,
}: NavDropdownProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="text-gray-700 dark:text-gray-300 hover:text-smccd-blue-900 dark:hover:text-smccd-blue-400 hover:bg-smccd-blue-50 dark:hover:bg-smccd-blue-950/20 gap-2 bg-transparent border-gray-300 dark:border-gray-600 hover:border-smccd-blue-300 dark:hover:border-smccd-blue-700 focus:border-smccd-blue-500 transition-all duration-200"
          aria-label={`Account menu for ${userDisplay}`}
          aria-expanded="false"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:block text-sm font-medium truncate max-w-[150px]">
            {userDisplay}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 py-1"
      >
        {/* User info header (only on mobile) */}
        <div className="sm:hidden px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {userDisplay}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Faculty Member
          </p>
        </div>

        <DropdownMenuItem asChild>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 cursor-pointer px-3 py-2 group transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <LayoutDashboard className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            <span className="transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              Dashboard
            </span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/profile"
            className="flex items-center gap-3 cursor-pointer px-3 py-2 group transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <User className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            <span className="transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              Profile
            </span>
          </Link>
        </DropdownMenuItem>

        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link
              href="/admin"
              className="flex items-center gap-3 cursor-pointer px-3 py-2 group transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <Settings className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              <span className="transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Admin Panel
              </span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild>
          <Link
            href="/docs"
            className="flex items-center gap-3 cursor-pointer px-3 py-2 group transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <HelpCircle className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            <span className="transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              Help
            </span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 border-gray-200" />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-3 cursor-pointer px-3 py-2 mx-1 rounded-md group transition-all duration-200 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-800 dark:focus:text-red-300"
          aria-label="Sign out of your account"
        >
          <LogOut
            className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
            aria-hidden="true"
          />
          <span className="transition-colors duration-200">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
