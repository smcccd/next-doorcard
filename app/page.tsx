"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

import { type College } from "@/types/doorcard";
import { Calendar } from "lucide-react";
import {
  useSearchAutocomplete,
  type AutocompleteSuggestion,
} from "@/hooks/useSearchAutocomplete";
import { extractDepartmentFromText } from "@/lib/departments";
import { useActiveTerm } from "@/hooks/useActiveTerm";
import { useDebounce } from "@/hooks/useDebounce";
import { SearchForm } from "@/components/ui/search-form";
import { ProfessorGrid } from "@/components/ui/professor-grid";

import type {
  PublicDoorcard,
  PublicDoorcardResponse as DoorcardResponse,
} from "@/types/pages/public";
import { DayOfWeek } from "@prisma/client";

export default function Home() {
  const router = useRouter();
  const [doorcards, setDoorcards] = useState<PublicDoorcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampus, setSelectedCampus] = useState<College | "ALL">("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showCurrentTermOnly, setShowCurrentTermOnly] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | "ALL">("ALL");

  // Get active term information
  const { activeTerm, isLoading: termLoading } = useActiveTerm();

  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Autocomplete suggestions
  const suggestions = useSearchAutocomplete(
    doorcards,
    searchTerm,
    showAutocomplete
  );

  useEffect(() => {
    fetchDoorcards();
  }, []);

  const fetchDoorcards = async () => {
    try {
      const response = await fetch("/api/doorcards/public");
      const data: DoorcardResponse = await response.json();
      setDoorcards(data.doorcards);
    } catch (error) {
      console.error("Error fetching doorcards:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has applied any filters or search beyond the default current term filter
  const hasActiveFilters =
    !!debouncedSearchTerm ||
    selectedCampus !== "ALL" ||
    selectedDepartment !== "ALL" ||
    selectedDay !== "ALL";

  // Memoized filtered doorcards using debounced search
  const filteredDoorcards = useMemo(() => {
    let filtered = doorcards;

    // Filter by campus
    if (selectedCampus !== "ALL") {
      filtered = filtered.filter((dc) => dc.college === selectedCampus);
    }

    // Filter by department
    if (selectedDepartment !== "ALL") {
      filtered = filtered.filter((dc) => {
        // Check department based on doorcard name or professor name
        const deptFromName = extractDepartmentFromText(dc.name);
        const deptFromDoorcardName = extractDepartmentFromText(dc.doorcardName);
        const deptFromUserName = extractDepartmentFromText(dc.user?.name || "");

        return (
          deptFromName === selectedDepartment ||
          deptFromDoorcardName === selectedDepartment ||
          deptFromUserName === selectedDepartment
        );
      });
    }

    // Filter by current term only (but only after API has loaded to avoid mismatch)
    if (showCurrentTermOnly && activeTerm && !termLoading) {
      filtered = filtered.filter((dc) => {
        const termMatches =
          dc.term.toUpperCase() === activeTerm.season.toUpperCase();
        const yearMatches =
          dc.year ===
          (typeof activeTerm.year === "string"
            ? parseInt(activeTerm.year)
            : activeTerm.year);
        return termMatches && yearMatches;
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

    // Filter by availability on specific day
    if (selectedDay !== "ALL") {
      filtered = filtered.filter((dc) => {
        return dc.availableDays && dc.availableDays.includes(selectedDay);
      });
    }

    // Sort results
    filtered = filtered.sort((a, b) => {
      // First sort by appointment count (desc)
      if (b.appointmentCount !== a.appointmentCount) {
        return b.appointmentCount - a.appointmentCount;
      }
      // Then sort by name (asc)
      return a.name.localeCompare(b.name);
    });

    // If no active filters applied, show top 24 results for better performance
    if (!hasActiveFilters) {
      return filtered.slice(0, 24);
    }

    return filtered;
  }, [
    doorcards,
    selectedCampus,
    selectedDepartment,
    showCurrentTermOnly,
    activeTerm,
    debouncedSearchTerm,
    hasActiveFilters,
    selectedDay,
    termLoading,
  ]);

  const handleDoorcardClick = (doorcard: PublicDoorcard) => {
    const username =
      doorcard.user?.username ||
      doorcard.user?.name?.toLowerCase().replace(/\s+/g, "-") ||
      "user";
    router.push(`/view/${username}`);
  };

  const handleAutocompleteSelect = (suggestion: AutocompleteSuggestion) => {
    if (suggestion.type === "professor") {
      setSearchTerm(suggestion.value);
    } else if (suggestion.type === "department") {
      setSelectedDepartment(suggestion.value);
      setSearchTerm(""); // Clear search when selecting department
    }
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
      <div className="bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 dark:from-blue-700 dark:via-blue-800 dark:to-blue-900">
          {/* Background Pattern - Light mode uses blue dots, dark mode uses white */}
          <div
            className="absolute inset-0 opacity-10 dark:opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "60px 60px",
            }}
          ></div>

          {/* Overlay gradient for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-800/30 to-transparent dark:from-black/20"></div>

          {/* Hero Content */}
          <div className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="text-center max-w-5xl mx-auto">
              <p className="text-xs sm:text-sm font-semibold text-blue-100 mb-3 uppercase tracking-widest">
                Office Hours & Contact Information
              </p>
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-6 leading-[1.1] tracking-tight">
                Find Your Professor
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-blue-100 font-normal max-w-2xl mx-auto">
                San Mateo County Community College District
              </p>
              {activeTerm && (
                <div className="mt-8">
                  <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-5 py-2.5">
                    <Calendar className="h-4 w-4 text-blue-100" />
                    <span className="text-sm font-medium text-white">
                      {termLoading ? "Loading term..." : activeTerm.displayName}
                    </span>
                    {!termLoading && activeTerm.isFromDatabase && (
                      <span className="text-xs text-blue-100 font-medium">
                        (Active)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced Info Card in Hero */}
              {/* <div className="max-w-2xl mx-auto">
              <div className="bg-white/15 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-xl p-4 sm:p-6 text-left shadow-lg">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-white/25 dark:bg-white/20 rounded-lg flex items-center justify-center">
                    <Search className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base sm:text-lg mb-2">
                      Need to meet with a professor?
                    </h3>
                    <p className="text-blue-50 dark:text-blue-100 text-xs sm:text-sm leading-relaxed">
                      Find their office hours, location, and contact details.
                      Each faculty profile shows when they&apos;re available for
                      student meetings, their office number, and how to reach
                      them across our three campuses.
                    </p>
                  </div>
                </div>
              </div>
            </div> */}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-gray-50 dark:bg-gray-900">
          {/* Search and Filter */}
          <SearchForm
            searchTerm={searchTerm}
            selectedCampus={selectedCampus}
            selectedDepartment={selectedDepartment}
            selectedDay={selectedDay}
            showCurrentTermOnly={showCurrentTermOnly}
            showAutocomplete={showAutocomplete}
            suggestions={suggestions}
            activeTerm={activeTerm}
            termLoading={termLoading}
            onSearchChange={handleSearchChange}
            onSearchFocus={handleSearchFocus}
            onCampusChange={setSelectedCampus}
            onDepartmentChange={setSelectedDepartment}
            onDayChange={setSelectedDay}
            onTermToggleChange={setShowCurrentTermOnly}
            onAutocompleteSelect={handleAutocompleteSelect}
            onAutocompleteClose={() => setShowAutocomplete(false)}
          />

          {/* Directory */}
          <ProfessorGrid
            doorcards={filteredDoorcards}
            loading={loading}
            activeTerm={activeTerm}
            activeLetter={null}
            hasActiveFilters={hasActiveFilters}
            selectedDay={selectedDay}
            selectedDepartment={selectedDepartment}
            selectedCampus={selectedCampus}
            searchTerm={searchTerm}
            onDoorcardClick={handleDoorcardClick}
          />
        </div>
      </div>
    </>
  );
}
