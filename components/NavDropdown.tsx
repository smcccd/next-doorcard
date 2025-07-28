"use client";

import Link from "next/link";
import { ChevronDown, User, HelpCircle, LogOut, Settings, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { DarkModeToggle } from "./DarkModeToggle";

interface NavDropdownProps {
  userDisplay: string;
  isAdmin?: boolean;
}

export function NavDropdown({ userDisplay, isAdmin = false }: NavDropdownProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="text-white hover:text-white focus:text-white hover:bg-gray-900 focus:bg-gray-900 gap-2 bg-transparent border-gray-600 hover:border-gray-400 focus:border-gray-400"
        >
          {/* Show different content on mobile vs desktop */}
          <span className="hidden sm:block text-sm">
            Welcome, <span className="font-medium">{userDisplay}</span>
          </span>
          <span className="sm:hidden">
            <Menu className="h-5 w-5" />
          </span>
          <ChevronDown className="h-4 w-4 hidden sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-white text-gray-900 border-gray-200"
      >
        {/* User info header (only on mobile) */}
        <div className="sm:hidden px-2 py-2 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-900">{userDisplay}</p>
          <p className="text-xs text-gray-500">Faculty Member</p>
        </div>
        
        <DropdownMenuItem asChild>
          <Link 
            href="/profile" 
            className="flex items-center gap-2 cursor-pointer"
          >
            <User className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link 
              href="/admin" 
              className="flex items-center gap-2 cursor-pointer"
            >
              <Settings className="h-4 w-4" />
              Admin Panel
            </Link>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem asChild>
          <Link 
            href="/docs" 
            className="flex items-center gap-2 cursor-pointer"
          >
            <HelpCircle className="h-4 w-4" />
            Help
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1">
          <DarkModeToggle />
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="flex items-center gap-2 cursor-pointer text-red-700 hover:bg-red-50 focus:bg-red-50 focus:text-red-800"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}