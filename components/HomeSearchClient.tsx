"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { type College } from "@/types/doorcard";
import { Search, X, ChevronLeft, ChevronRight, Users } from "lucide-react";
import {
  useSearchAutocomplete,
  type AutocompleteSuggestion,
} from "@/hooks/useSearchAutocomplete";
import { useDebounce } from "@/hooks/useDebounce";
import { SimpleFacultyGrid } from "@/components/ui/simple-faculty-grid";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import type { PublicDoorcard } from "@/types/pages/public";
import { DayOfWeek } from "@prisma/client";
import type { ActiveTermInfo } from "@/lib/active-term";

interface HomeSearchClientProps {
  initialDoorcards: PublicDoorcard[];
  activeTerm: ActiveTermInfo | null;
  termLoading: boolean;
  inHero?: boolean;
  isAuthenticated?: boolean;
}

export function HomeSearchClient({
  initialDoorcards,
  activeTerm,
  termLoading,
  inHero = false,
  isAuthenticated = false,
}: HomeSearchClientProps) {
  const router = useRouter();
  const [doorcards] = useState<PublicDoorcard[]>(initialDoorcards);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampus, setSelectedCampus] = useState<College | "ALL">("ALL");
  const [selectedLastNameFilter, setSelectedLastNameFilter] =
    useState<string>("ALL");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 5;

  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCampus, selectedLastNameFilter, debouncedSearchTerm]);

  // Autocomplete suggestions
  const suggestions = useSearchAutocomplete(
    doorcards,
    searchTerm,
    showAutocomplete
  );

  // Memoized filtered doorcards - current term + last name filtering
  const filteredDoorcards = useMemo(() => {
    let filtered = doorcards;

    // Always filter to current term only for public search
    if (activeTerm && !termLoading) {
      filtered = filtered.filter((dc) => {
        const termMatches =
          dc.term.toUpperCase() === activeTerm.season.toUpperCase();
        const yearMatches = dc.year === activeTerm.year;
        return termMatches && yearMatches;
      });
    }

    // Filter by campus
    if (selectedCampus !== "ALL") {
      filtered = filtered.filter((dc) => dc.college === selectedCampus);
    }

    // Filter by last name
    if (selectedLastNameFilter !== "ALL") {
      filtered = filtered.filter((dc) => {
        const lastName = dc.user.name?.split(" ").pop()?.toLowerCase() || "";
        return lastName.startsWith(selectedLastNameFilter.toLowerCase());
      });
    }

    // Filter by search term (using debounced value)
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (dc) =>
          dc.name.toLowerCase().includes(term) ||
          dc.doorcardName.toLowerCase().includes(term) ||
          dc.user.name?.toLowerCase().includes(term)
      );
    }

    // Sort results by relevance
    filtered = filtered.sort((a, b) => {
      // First sort by appointment count (desc) - more active faculty first
      if (b.appointmentCount !== a.appointmentCount) {
        return b.appointmentCount - a.appointmentCount;
      }
      // Then sort by name (asc)
      return a.name.localeCompare(b.name);
    });

    // Show results if user has searched OR selected any filter
    const hasActiveFilters =
      !!debouncedSearchTerm ||
      selectedCampus !== "ALL" ||
      selectedLastNameFilter !== "ALL";
    if (!hasActiveFilters) {
      return [];
    }

    return filtered;
  }, [
    doorcards,
    selectedCampus,
    selectedLastNameFilter,
    activeTerm,
    debouncedSearchTerm,
    termLoading,
  ]);

  // Check if user has actively searched or filtered
  const hasActiveFilters =
    !!debouncedSearchTerm ||
    selectedCampus !== "ALL" ||
    selectedLastNameFilter !== "ALL";

  // Pagination calculations for non-filtered doorcards
  const totalPages = Math.ceil(doorcards.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedDoorcards = doorcards.slice(startIndex, endIndex);

  const handleDoorcardClick = (doorcard: PublicDoorcard) => {
    const username =
      doorcard.user?.username ||
      doorcard.user?.name?.toLowerCase().replace(/\s+/g, "-") ||
      "user";
    router.push(`/view/${username}`);
  };

  const handleAutocompleteSelect = (suggestion: AutocompleteSuggestion) => {
    setSearchTerm(suggestion.value);
    setShowAutocomplete(false);
  };

  const handleSearchFocus = () => {
    setShowAutocomplete(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowAutocomplete(true);
  };

  // Render only hero elements when inHero is true
  if (inHero) {
    return (
      <>
        {/* Search & Filters - Hero Version */}
        <div className="max-w-4xl mx-auto my-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search professors..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              className="w-full pl-16 pr-16 py-4 text-lg bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-200 text-gray-900 placeholder-gray-500 shadow-xl"
              aria-label="Search for faculty members"
              role="searchbox"
              aria-autocomplete="list"
              aria-owns={showAutocomplete ? "search-suggestions" : undefined}
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCampus("ALL");
                  setSelectedLastNameFilter("ALL");
                }}
                className="absolute inset-y-0 right-0 pr-6 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            )}

            {/* Autocomplete - positioned for hero */}
            {showAutocomplete && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-3">
                <ul
                  id="search-suggestions"
                  role="listbox"
                  className="bg-white rounded-xl shadow-2xl border border-gray-200 max-h-80 overflow-y-auto"
                >
                  {suggestions.slice(0, 8).map((suggestion, index) => (
                    <li key={index} role="option" aria-selected={false}>
                      <button
                        onClick={() => handleAutocompleteSelect(suggestion)}
                        className="w-full px-6 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl border-b last:border-b-0 border-gray-100 focus:outline-none focus:ring-2 focus:ring-smccd-blue-500"
                        aria-label={`Select ${suggestion.value} (${suggestion.type})`}
                      >
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-smccd-blue-600" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {suggestion.value}
                            </div>
                            <div className="text-sm text-gray-700">
                              Professor
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Hero Version */}
        <div className="flex justify-center mx-auto mt-8 mb-12">
          <Link href={isAuthenticated ? "/dashboard" : "/login"}>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-white/40 bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-blue-900 font-semibold py-4 px-8 text-lg rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isAuthenticated ? "Visit Dashboard" : "Faculty Log In"}
            </Button>
          </Link>
        </div>
      </>
    );
  }

  // Render search results section when not in hero
  return (
    <div
      id="search-results"
      className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-gray-50 dark:bg-gray-900"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header with Title */}
        <div className="text-center mb-8">
          <h2
            id="faculty-results-heading"
            className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
          >
            {hasActiveFilters ? "Search Results" : "Recent Faculty Doorcards"}
          </h2>
          {!hasActiveFilters && (
            <p className="text-gray-700 dark:text-gray-300">
              Use the search above or select a campus below to find specific
              faculty for {activeTerm?.displayName || "the current term"}
            </p>
          )}
        </div>

        {/* Filter Bar */}
        <div
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
          role="search"
          aria-label="Faculty filter options"
        >
          {/* Campus Filter */}
          <div className="mb-6">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 block mb-3">
              Filter by Campus:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCampus("ALL")}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-smccd-blue-500 focus:ring-offset-2 ${
                  selectedCampus === "ALL"
                    ? "bg-smccd-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                aria-pressed={selectedCampus === "ALL"}
                aria-label="Show faculty from all campuses"
              >
                All Campuses
              </button>
              <button
                onClick={() => setSelectedCampus("SKYLINE")}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-smccd-blue-500 focus:ring-offset-2 ${
                  selectedCampus === "SKYLINE"
                    ? "bg-smccd-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                aria-pressed={selectedCampus === "SKYLINE"}
                aria-label="Show faculty from Skyline College"
              >
                Skyline College
              </button>
              <button
                onClick={() => setSelectedCampus("CSM")}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-smccd-blue-500 focus:ring-offset-2 ${
                  selectedCampus === "CSM"
                    ? "bg-smccd-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                aria-pressed={selectedCampus === "CSM"}
                aria-label="Show faculty from College of San Mateo"
              >
                College of San Mateo
              </button>
              <button
                onClick={() => setSelectedCampus("CANADA")}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-smccd-blue-500 focus:ring-offset-2 ${
                  selectedCampus === "CANADA"
                    ? "bg-smccd-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                aria-pressed={selectedCampus === "CANADA"}
                aria-label="Show faculty from Cañada College"
              >
                Cañada College
              </button>
            </div>
          </div>

          {/* Last Name Filter */}
          <div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 block mb-3">
              Filter by Last Name:
            </span>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setSelectedLastNameFilter("ALL")}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-smccd-blue-500 focus:ring-offset-1 ${
                  selectedLastNameFilter === "ALL"
                    ? "bg-smccd-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                aria-pressed={selectedLastNameFilter === "ALL"}
                aria-label="Show all faculty regardless of last name"
              >
                All
              </button>
              {Array.from({ length: 26 }, (_, i) =>
                String.fromCharCode(65 + i)
              ).map((letter) => (
                <button
                  key={letter}
                  onClick={() => setSelectedLastNameFilter(letter)}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-smccd-blue-500 focus:ring-offset-1 ${
                    selectedLastNameFilter === letter
                      ? "bg-smccd-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                  aria-pressed={selectedLastNameFilter === letter}
                  aria-label={`Filter faculty by last name starting with ${letter}`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {hasActiveFilters ? (
        <SimpleFacultyGrid
          doorcards={filteredDoorcards}
          loading={false}
          onDoorcardClick={handleDoorcardClick}
        />
      ) : (
        <>
          <SimpleFacultyGrid
            doorcards={paginatedDoorcards}
            loading={termLoading}
            onDoorcardClick={handleDoorcardClick}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <span className="text-sm text-gray-700 font-medium bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
