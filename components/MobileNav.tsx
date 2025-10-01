"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { externalLinks, navigationItems } from "@/lib/navigation";

interface MobileNavProps {
  session?: any;
  userDisplay?: string;
  isAdmin?: boolean;
}

export default function MobileNav({ session, isAdmin }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Close menu on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  return (
    <div className="md:hidden">
      {/* Mobile menu button */}
      <button
        onClick={toggleMenu}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-smccd-blue-900 text-white hover:bg-smccd-blue-800 focus:outline-none focus:ring-2 focus:ring-smccd-blue-700 focus:ring-offset-2 transition-colors duration-200 font-semibold text-sm min-h-[44px]"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? (
          <>
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="hidden xs:inline">Close</span>
          </>
        ) : (
          <>
            <Menu className="h-4 w-4" aria-hidden="true" />
            <span className="hidden xs:inline">Menu</span>
          </>
        )}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeMenu}
            onKeyDown={(e) => e.key === "Escape" && closeMenu()}
            aria-hidden="true"
          />

          {/* Mobile menu panel */}
          <div
            id="mobile-menu"
            className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="py-2">
              {externalLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={closeMenu}
                >
                  {link.text}
                </a>
              ))}

              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

              <a
                href="https://site-index.smccd.edu"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={closeMenu}
              >
                Site Index
              </a>

              {/* App Navigation Links */}
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-3 text-base text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  onClick={closeMenu}
                  aria-label={item.ariaLabel}
                >
                  {item.label}
                </Link>
              ))}

              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={closeMenu}
                  >
                    Dashboard
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={closeMenu}
                    >
                      Admin
                    </Link>
                  )}
                  <form action="/api/auth/signout" method="post">
                    <button
                      type="submit"
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={closeMenu}
                    >
                      Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block px-4 py-3 text-base text-blue-600 dark:text-blue-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={closeMenu}
                >
                  Faculty Login
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
