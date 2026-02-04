"use client";

import { useDarkMode } from "./DarkModeProvider";
import { Button } from "../ui/button";
import { Sun, Moon } from "lucide-react";

export function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleDarkMode}
      className="w-full justify-start hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 group"
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="mr-3">
        {isDarkMode ? (
          <Sun className="h-4 w-4 text-yellow-500 transition-transform duration-200 group-hover:scale-110" />
        ) : (
          <Moon className="h-4 w-4 text-blue-600 transition-transform duration-200 group-hover:scale-110" />
        )}
      </div>
      <span className="text-sm transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
        {isDarkMode ? "Light Mode" : "Dark Mode"}
      </span>
    </Button>
  );
}
