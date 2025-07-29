"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Loader2 } from "lucide-react";

const ALPHABET_LETTERS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

interface SiteIndexProps {
  onLetterClick?: (letter: string) => void;
  activeLetter?: string;
  isFiltering?: boolean;
  professorCounts?: Record<string, number>;
  useStaticLinks?: boolean;
}

export default function SiteIndex({
  onLetterClick,
  activeLetter,
  isFiltering = false,
  professorCounts = {},
  useStaticLinks = false,
}: SiteIndexProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  // Don't show site index on authentication pages or other special pages
  const shouldHide =
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/reset-password") ||
    pathname.includes("/api/") ||
    pathname.includes("/404") ||
    pathname.includes("/500");

  if (shouldHide) {
    return null;
  }

  const handleLetterClick = (letter: string) => {
    if (onLetterClick) {
      onLetterClick(letter);
    } else {
      // Fallback to original behavior
      const element = document.getElementById(
        `section-${letter.toLowerCase()}`
      );
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setIsExpanded(false); // Close on mobile after selection
  };

  return (
    <div className="w-full bg-gradient-to-r from-blue-800 to-blue-900 dark:from-blue-900 dark:to-blue-950 shadow-sm">
      {/* Desktop View */}
      <div className="hidden lg:block">
        <div className="mx-auto px-6">
          <div className="flex items-center justify-between py-3">
            <span className="text-white font-medium text-sm tracking-wide">
              Site Index:
            </span>
            <div className="flex items-center space-x-3">
              {ALPHABET_LETTERS.map((letter) => {
                const count = professorCounts[letter] || 0;
                const isActive = activeLetter === letter;
                const hasCount = count > 0;

                if (useStaticLinks) {
                  return (
                    <Link
                      key={letter}
                      href={`/faculty/${letter.toLowerCase()}`}
                      className={`relative text-white transition-all duration-200 px-2 py-1 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 inline-block ${
                        pathname === `/faculty/${letter.toLowerCase()}`
                          ? "bg-blue-600 text-white"
                          : hasCount
                            ? "hover:text-blue-200 hover:bg-blue-700"
                            : "opacity-50 cursor-not-allowed pointer-events-none"
                      }`}
                      title={
                        hasCount
                          ? `View professors whose last names start with ${letter} (${count} found)`
                          : `No professors found for ${letter}`
                      }
                      aria-disabled={!hasCount}
                    >
                      {letter}
                      {hasCount && count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-400 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          {count > 9 ? "9+" : count}
                        </span>
                      )}
                    </Link>
                  );
                }

                return (
                  <button
                    key={letter}
                    className={`relative text-white transition-all duration-200 px-2 py-1 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : hasCount
                          ? "hover:text-blue-200 hover:bg-blue-700"
                          : "opacity-50 cursor-not-allowed"
                    }`}
                    onClick={() => hasCount && handleLetterClick(letter)}
                    disabled={!hasCount || isFiltering}
                    title={
                      hasCount
                        ? `View professors whose last names start with ${letter} (${count} found)`
                        : `No professors found for ${letter}`
                    }
                  >
                    {isFiltering && isActive ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {letter}
                        {hasCount && count > 0 && (
                          <span className="absolute -top-1 -right-1 bg-blue-400 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            {count > 9 ? "9+" : count}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet View */}
      <div className="lg:hidden">
        <div className="px-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 rounded-lg px-2"
          >
            <span className="font-medium text-sm tracking-wide">
              Site Index
            </span>
            <ChevronDown
              className={`w-5 h-5 transform transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {isExpanded && (
            <div className="pb-4 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {ALPHABET_LETTERS.map((letter) => {
                  const count = professorCounts[letter] || 0;
                  const isActive = activeLetter === letter;
                  const hasCount = count > 0;

                  if (useStaticLinks) {
                    return (
                      <Link
                        key={letter}
                        href={`/faculty/${letter.toLowerCase()}`}
                        className={`relative text-white transition-all duration-200 py-2 px-1 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 text-center inline-block ${
                          pathname === `/faculty/${letter.toLowerCase()}`
                            ? "bg-blue-600 text-white"
                            : hasCount
                              ? "hover:text-blue-200 hover:bg-blue-700"
                              : "opacity-50 cursor-not-allowed pointer-events-none"
                        }`}
                        aria-disabled={!hasCount}
                      >
                        {letter}
                        {hasCount && count > 0 && (
                          <span className="absolute -top-1 -right-1 bg-blue-400 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center">
                            {count > 9 ? "9" : count}
                          </span>
                        )}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={letter}
                      className={`relative text-white transition-all duration-200 py-2 px-1 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 text-center ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : hasCount
                            ? "hover:text-blue-200 hover:bg-blue-700"
                            : "opacity-50 cursor-not-allowed"
                      }`}
                      onClick={() => hasCount && handleLetterClick(letter)}
                      disabled={!hasCount || isFiltering}
                    >
                      {isFiltering && isActive ? (
                        <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                      ) : (
                        <>
                          {letter}
                          {hasCount && count > 0 && (
                            <span className="absolute -top-1 -right-1 bg-blue-400 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center">
                              {count > 9 ? "9" : count}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
