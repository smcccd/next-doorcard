"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Sparkles,
  Users,
  BookOpen,
  MapPin,
  Clock,
  X,
} from "lucide-react";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";
import { type AutocompleteSuggestion } from "@/hooks/useSearchAutocomplete";
import { College } from "@/types/doorcard";

interface SimpleSearchProps {
  searchTerm: string;
  showAutocomplete: boolean;
  suggestions: AutocompleteSuggestion[];
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchFocus: () => void;
  onAutocompleteSelect: (suggestion: AutocompleteSuggestion) => void;
  onAutocompleteClose: () => void;
  onQuickFilter: (type: string, value: string) => void;
  onClearSearch: () => void;
  hasResults: boolean;
}

export function SimpleSearch({
  searchTerm,
  showAutocomplete,
  suggestions,
  onSearchChange,
  onSearchFocus,
  onAutocompleteSelect,
  onAutocompleteClose,
  onQuickFilter,
  onClearSearch,
  hasResults,
}: SimpleSearchProps) {
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);

  const quickFilters = [
    {
      id: "math",
      icon: <BookOpen className="w-4 h-4" />,
      label: "Math",
      value: "Mathematics",
      color:
        "bg-smccd-blue-100 text-smccd-blue-700 hover:bg-smccd-blue-200 border-smccd-blue-200",
    },
    {
      id: "english",
      icon: <BookOpen className="w-4 h-4" />,
      label: "English",
      value: "English",
      color:
        "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200",
    },
    {
      id: "science",
      icon: <BookOpen className="w-4 h-4" />,
      label: "Science",
      value: "Science",
      color:
        "bg-violet-100 text-violet-700 hover:bg-violet-200 border-violet-200",
    },
    {
      id: "skyline",
      icon: <MapPin className="w-4 h-4" />,
      label: "Skyline",
      value: "SKYLINE",
      color:
        "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200",
    },
    {
      id: "csm",
      icon: <MapPin className="w-4 h-4" />,
      label: "CSM",
      value: "CSM",
      color: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200",
    },
    {
      id: "canada",
      icon: <MapPin className="w-4 h-4" />,
      label: "Cañada",
      value: "CANADA",
      color: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200 border-cyan-200",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Search Input Section */}
        <div className="p-6 pb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search for professors, departments, or courses..."
              value={searchTerm}
              onChange={onSearchChange}
              onFocus={onSearchFocus}
              className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-smccd-blue-700 focus:ring-4 focus:ring-smccd-blue-100 dark:focus:ring-smccd-blue-900 transition-all duration-200 bg-gray-50 dark:bg-gray-700"
            />
            {searchTerm && (
              <button
                onClick={onClearSearch}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            {/* Autocomplete */}
            {showAutocomplete && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2">
                <SearchAutocomplete
                  suggestions={suggestions}
                  isVisible={showAutocomplete}
                  onSelect={onAutocompleteSelect}
                  onClose={onAutocompleteClose}
                />
              </div>
            )}
          </div>
        </div>

        {/* Fun Quick Filters */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Popular searches:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <Badge
                key={filter.id}
                variant="outline"
                className={`cursor-pointer transition-all duration-200 border ${filter.color} ${
                  hoveredFilter === filter.id ? "scale-105 shadow-md" : ""
                }`}
                onMouseEnter={() => setHoveredFilter(filter.id)}
                onMouseLeave={() => setHoveredFilter(null)}
                onClick={() => {
                  if (
                    filter.id.includes("skyline") ||
                    filter.id.includes("csm") ||
                    filter.id.includes("canada")
                  ) {
                    onQuickFilter("campus", filter.value);
                  } else {
                    onQuickFilter("department", filter.value);
                  }
                }}
              >
                {filter.icon}
                <span className="ml-1">{filter.label}</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Search Stats */}
        {searchTerm && (
          <div className="bg-smccd-blue-50 dark:bg-smccd-blue-900/20 px-6 py-3 border-t border-smccd-blue-100 dark:border-smccd-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-smccd-blue-700 dark:text-smccd-blue-300">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {hasResults ? "Search results below" : "No results found"}
                </span>
              </div>
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSearch}
                  className="text-smccd-blue-600 hover:text-smccd-blue-800 hover:bg-smccd-blue-100 dark:hover:bg-smccd-blue-800"
                >
                  Clear search
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Helpful Tips */}
      {!searchTerm && (
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            💡 <strong>Pro tip:</strong> Try searching by professor name,
            subject (like "Math 120"), or campus location
          </p>
        </div>
      )}
    </div>
  );
}
