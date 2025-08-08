"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { type College } from "@/types/doorcard";
import { Users, Search, X, BookOpen } from "lucide-react";
import {
  useSearchAutocomplete,
  type AutocompleteSuggestion,
} from "@/hooks/useSearchAutocomplete";
import { useDebounce } from "@/hooks/useDebounce";
import { SimpleFacultyGrid } from "@/components/ui/simple-faculty-grid";
import { Button } from "@/components/ui/button";
import { RecentDoorcards } from "@/components/RecentDoorcards";
import Link from "next/link";

import type { PublicDoorcard } from "@/types/pages/public";
import { DayOfWeek } from "@prisma/client";
import type { ActiveTermInfo } from "@/lib/active-term";

interface HomeSearchClientProps {
  initialDoorcards: PublicDoorcard[];
  activeTerm: ActiveTermInfo | null;
  termLoading: boolean;
}

export function HomeSearchClient({
  initialDoorcards,
  activeTerm,
  termLoading,
}: HomeSearchClientProps) {
  const router = useRouter();
  const [doorcards] = useState<PublicDoorcard[]>(initialDoorcards);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampus, setSelectedCampus] = useState<College | "ALL">("ALL");
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Autocomplete suggestions
  const suggestions = useSearchAutocomplete(
    doorcards,
    searchTerm,
    showAutocomplete
  );

  // Memoized filtered doorcards - current term + campus filtering
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

    // Show results if user has searched OR selected a specific campus
    const hasActiveFilters = !!debouncedSearchTerm || selectedCampus !== "ALL";
    if (!hasActiveFilters) {
      return [];
    }

    return filtered;
  }, [doorcards, selectedCampus, activeTerm, debouncedSearchTerm, termLoading]);

  // Check if user has actively searched or filtered
  const hasActiveFilters = !!debouncedSearchTerm || selectedCampus !== "ALL";

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

  return (
    <>
      {/* Search & Filters */}
      <div className="max-w-3xl mx-auto my-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search professors, departments, or courses..."
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            className="w-full pl-12 pr-12 py-3.5 text-base bg-white/95 backdrop-blur-sm border border-white/30 rounded-xl focus:border-white focus:ring-2 focus:ring-white/25 transition-all duration-300 text-gray-900 placeholder-gray-500 shadow-lg"
            aria-label="Search for faculty members, departments, or courses"
            role="searchbox"
            aria-autocomplete="list"
            aria-owns={showAutocomplete ? "search-suggestions" : undefined}
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCampus("ALL");
              }}
              className="absolute inset-y-0 right-0 pr-6 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
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
                        {suggestion.type === "professor" ? (
                          <Users className="w-4 h-4 text-smccd-blue-600" />
                        ) : (
                          <BookOpen className="w-4 h-4 text-emerald-600" />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {suggestion.value}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {suggestion.type}
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

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto mb-16">
        <Link href="/browse" className="flex-1 sm:flex-initial">
          <Button className="w-full bg-white text-smccd-blue-900 hover:bg-gray-100 font-semibold py-3 px-6 text-base shadow-lg transition-all duration-200">
            <Users className="w-4 h-4 mr-2" />
            Browse All Faculty
          </Button>
        </Link>
        <Link href="/login" className="flex-1 sm:flex-initial">
          <Button
            variant="outline"
            className="w-full border-white/30 bg-transparent text-white hover:bg-white hover:text-smccd-blue-900 font-semibold py-3 px-6 text-base transition-all duration-200"
          >
            Faculty Log In
          </Button>
        </Link>
      </div>

      {/* Search Results Section - Shows search results OR recent doorcards */}
      <div
        id="search-results"
        className="px-4 sm:px-6 lg:px-8 py-16 space-y-8 bg-white dark:bg-gray-900"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header with Title */}
          <div className="text-center mb-8">
            <h2
              id="faculty-results-heading"
              className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
            >
              {hasActiveFilters ? "Search Results" : "Recent Faculty Doorcards"}
            </h2>
            {!hasActiveFilters && (
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Use the search above or select a campus below to find specific
                faculty for {activeTerm?.displayName || "the current term"}
              </p>
            )}
          </div>

          {/* Campus Filter with Logos */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 mb-12 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Browse by Campus
              </h3>
              <div className="flex justify-center items-center gap-6 flex-wrap">
                {/* All Campuses */}
                <button
                  onClick={() => setSelectedCampus("ALL")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-smccd-blue-500 focus:ring-offset-2 ${
                    selectedCampus === "ALL"
                      ? "bg-smccd-blue-100 dark:bg-smccd-blue-900 ring-2 ring-smccd-blue-600"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  aria-pressed={selectedCampus === "ALL"}
                  aria-label="Filter by all campuses"
                >
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🏫</span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      selectedCampus === "ALL"
                        ? "text-smccd-blue-700 dark:text-smccd-blue-300"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    All Campuses
                  </span>
                </button>

                {/* Skyline College */}
                <button
                  onClick={() => setSelectedCampus("SKYLINE")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200 ${
                    selectedCampus === "SKYLINE"
                      ? "bg-smccd-blue-100 dark:bg-smccd-blue-900 ring-2 ring-smccd-blue-600"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
                    <Image
                      src="/skyline.svg"
                      alt="Skyline College"
                      width={48}
                      height={48}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      selectedCampus === "SKYLINE"
                        ? "text-smccd-blue-700 dark:text-smccd-blue-300"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Skyline College
                  </span>
                </button>

                {/* CSM */}
                <button
                  onClick={() => setSelectedCampus("CSM")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200 ${
                    selectedCampus === "CSM"
                      ? "bg-smccd-blue-100 dark:bg-smccd-blue-900 ring-2 ring-smccd-blue-600"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
                    <Image
                      src="/csm.jpg"
                      alt="College of San Mateo"
                      width={48}
                      height={48}
                      className="w-12 h-12 object-cover"
                    />
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      selectedCampus === "CSM"
                        ? "text-smccd-blue-700 dark:text-smccd-blue-300"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    College of San Mateo
                  </span>
                </button>

                {/* Cañada College */}
                <button
                  onClick={() => setSelectedCampus("CANADA")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200 ${
                    selectedCampus === "CANADA"
                      ? "bg-smccd-blue-100 dark:bg-smccd-blue-900 ring-2 ring-smccd-blue-600"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
                    <Image
                      src="/canada.svg"
                      alt="Cañada College"
                      width={48}
                      height={48}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      selectedCampus === "CANADA"
                        ? "text-smccd-blue-700 dark:text-smccd-blue-300"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Cañada College
                  </span>
                </button>
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
          <RecentDoorcards limit={25} showTitle={false} showFilter={false} />
        )}
      </div>
    </>
  );
}
