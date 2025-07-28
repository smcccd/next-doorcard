"use client";

import { Moon, Sun } from "lucide-react";
import { useDarkMode } from "./DarkModeProvider";
import { Button } from "./ui/button";

export function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleDarkMode}
      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
