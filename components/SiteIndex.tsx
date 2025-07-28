"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

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

export default function SiteIndex() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-8 w-full bg-gradient-to-r from-blue-800 to-blue-900 dark:from-blue-900 dark:to-blue-950 shadow-sm">
      {/* Desktop View */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-3">
            <span className="text-white font-medium text-sm tracking-wide">
              Site Index:
            </span>
            <div className="flex items-center space-x-3">
              {ALPHABET_LETTERS.map((letter) => (
                <button
                  key={letter}
                  className="text-white hover:text-blue-200 hover:bg-blue-700 transition-all duration-200 px-2 py-1 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
                  onClick={() => {
                    // Scroll to section or filter content by letter
                    const element = document.getElementById(
                      `section-${letter.toLowerCase()}`,
                    );
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  {letter}
                </button>
              ))}
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
                {ALPHABET_LETTERS.map((letter) => (
                  <button
                    key={letter}
                    className="text-white hover:text-blue-200 hover:bg-blue-700 transition-all duration-200 py-2 px-1 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 text-center"
                    onClick={() => {
                      // Scroll to section or filter content by letter
                      const element = document.getElementById(
                        `section-${letter.toLowerCase()}`,
                      );
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth" });
                      }
                      setIsExpanded(false); // Close on mobile after selection
                    }}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
