"use client";

import { useDarkMode } from "./DarkModeProvider";
import { Button } from "./ui/button";

export function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleDarkMode}
      className="w-full justify-start text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 group cursor-pointer"
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative w-5 h-5 mr-2">
        {/* Animated SVG */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          className="absolute inset-0 transition-all duration-700 ease-in-out"
        >
          {/* Sun rays */}
          <g
            className={`transition-all duration-700 origin-center ${
              isDarkMode
                ? "opacity-100 rotate-0 scale-100"
                : "opacity-0 rotate-180 scale-50"
            }`}
            fill="currentColor"
          >
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <line
                key={angle}
                x1="12"
                y1="2"
                x2="12"
                y2="4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                transform={`rotate(${angle} 12 12)`}
                className="text-yellow-500 group-hover:text-orange-400"
              />
            ))}
          </g>

          {/* Sun/Moon circle with morphing animation */}
          <circle
            cx="12"
            cy="12"
            r="4"
            fill="currentColor"
            className={`transition-all duration-700 ${
              isDarkMode
                ? "text-yellow-500 group-hover:text-orange-400"
                : "text-blue-400 group-hover:text-purple-400"
            }`}
          />

          {/* Moon crescent overlay */}
          <circle
            cx="15"
            cy="9"
            r="4"
            fill="rgb(31 41 55)"
            className={`transition-all duration-700 ${
              isDarkMode
                ? "opacity-0 translate-x-2 translate-y-2"
                : "opacity-100 translate-x-0 translate-y-0"
            }`}
          />
        </svg>
      </div>
      <span className="text-sm font-medium">
        {isDarkMode ? "Light Mode" : "Dark Mode"}
      </span>
    </Button>
  );
}
