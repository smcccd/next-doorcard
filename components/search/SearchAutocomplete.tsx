// components/SearchAutocomplete.tsx
"use client";

import { useEffect, useRef } from "react";
import { Search, User, Building2, BookOpen } from "lucide-react";
import type { AutocompleteSuggestion } from "@/hooks/useSearchAutocomplete";

interface SearchAutocompleteProps {
  suggestions: AutocompleteSuggestion[];
  isVisible: boolean;
  onSelect: (suggestion: AutocompleteSuggestion) => void;
  onClose: () => void;
}

export function SearchAutocomplete({
  suggestions,
  isVisible,
  onSelect,
  onClose,
}: SearchAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible, onClose]);

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "professor":
        return <User className="h-4 w-4 text-blue-500" />;
      case "department":
        return <Building2 className="h-4 w-4 text-green-500" />;
      case "course":
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto"
    >
      <div className="py-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none border-none bg-transparent transition-colors duration-150"
            onClick={() => onSelect(suggestion)}
          >
            <div className="flex items-center gap-3">
              {getIcon(suggestion.type)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {suggestion.text}
                </div>
                {suggestion.subtitle && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {suggestion.subtitle}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <Search className="h-3 w-3" />
            Press Enter to search or click a suggestion
          </div>
        </div>
      )}
    </div>
  );
}
