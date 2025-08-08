"use client";

import { useState, useEffect, useMemo } from "react";
import { PublicDoorcard } from "@/types/pages/public";
import { College } from "@/types/doorcard";
import { DayOfWeek } from "@prisma/client";
import { useActiveTerm } from "@/hooks/useActiveTerm";
import { useDebounce } from "@/hooks/useDebounce";
import {
  filterProfessors,
  hasActiveFilters,
  getTopResults,
  FilterOptions,
} from "@/lib/utils/filtering";
import { extractDepartmentFromText } from "@/lib/departments";
import { DoorcardGrid } from "./DoorcardGrid";
import { FilterBar } from "./FilterBar";
import { ResultsHeader } from "./ResultsHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";

export function BrowseDoorcards() {
  // State
  const [doorcards, setDoorcards] = useState<PublicDoorcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampus, setSelectedCampus] = useState<College | "ALL">("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | "ALL">("ALL");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [showCurrentTermOnly, setShowCurrentTermOnly] = useState(false);

  // Hooks
  const { activeTerm, isLoading } = useActiveTerm();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch doorcards
  useEffect(() => {
    async function fetchDoorcards() {
      try {
        setLoading(true);
        const response = await fetch("/api/doorcards/public");

        if (!response.ok) {
          throw new Error("Failed to fetch doorcards");
        }

        const data = await response.json();

        if (data.success) {
          setDoorcards(data.doorcards);
        } else {
          throw new Error(data.error || "Failed to fetch doorcards");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchDoorcards();
  }, []);

  // Create filter options
  const filterOptions: FilterOptions = useMemo(
    () => ({
      searchTerm: debouncedSearchTerm,
      selectedCampus,
      selectedDepartment,
      selectedDay,
      activeLetter,
      showCurrentTermOnly,
      activeTerm,
      termLoading: isLoading,
    }),
    [
      debouncedSearchTerm,
      selectedCampus,
      selectedDepartment,
      selectedDay,
      activeLetter,
      showCurrentTermOnly,
      activeTerm,
      isLoading,
    ]
  );

  // Filter doorcards
  const filteredDoorcards = useMemo(() => {
    const filtered = filterProfessors(doorcards, filterOptions);
    const hasFilters = hasActiveFilters({
      searchTerm: debouncedSearchTerm,
      selectedCampus,
      selectedDepartment,
      selectedDay,
      activeLetter,
      showCurrentTermOnly,
    });

    return getTopResults(filtered, hasFilters);
  }, [
    doorcards,
    filterOptions,
    debouncedSearchTerm,
    selectedCampus,
    selectedDepartment,
    selectedDay,
    activeLetter,
    showCurrentTermOnly,
  ]);

  // Get unique departments
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    doorcards.forEach((dc) => {
      const dept =
        extractDepartmentFromText(dc.name) ||
        extractDepartmentFromText(dc.doorcardName) ||
        extractDepartmentFromText(dc.user?.name || "");
      if (dept) deptSet.add(dept);
    });
    return Array.from(deptSet).sort();
  }, [doorcards]);

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCampus("ALL");
    setSelectedDepartment("ALL");
    setSelectedDay("ALL");
    setActiveLetter(null);
    setShowCurrentTermOnly(false);
  };

  // Check if any filters are active
  const hasFilters = hasActiveFilters({
    searchTerm: debouncedSearchTerm,
    selectedCampus,
    selectedDepartment,
    selectedDay,
    activeLetter,
    showCurrentTermOnly,
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading doorcards...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-800 font-medium">Error loading doorcards</p>
          <p className="text-red-600 text-sm mt-2">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search by faculty name, department, or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-lg py-6"
          />
        </div>

        <FilterBar
          selectedCampus={selectedCampus}
          onCampusChange={setSelectedCampus}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          departments={departments}
          selectedDay={selectedDay}
          onDayChange={setSelectedDay}
          activeLetter={activeLetter}
          onLetterChange={setActiveLetter}
          showCurrentTermOnly={showCurrentTermOnly}
          onCurrentTermChange={setShowCurrentTermOnly}
          activeTerm={activeTerm}
          termLoading={isLoading}
        />

        {/* Active Filters */}
        {hasFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Active filters:
            </span>

            {debouncedSearchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{debouncedSearchTerm}"
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-600"
                  onClick={() => setSearchTerm("")}
                />
              </Badge>
            )}

            {selectedCampus !== "ALL" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Campus: {selectedCampus}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-600"
                  onClick={() => setSelectedCampus("ALL")}
                />
              </Badge>
            )}

            {selectedDepartment !== "ALL" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Dept: {selectedDepartment}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-600"
                  onClick={() => setSelectedDepartment("ALL")}
                />
              </Badge>
            )}

            {selectedDay !== "ALL" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Day: {selectedDay.toLowerCase()}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-600"
                  onClick={() => setSelectedDay("ALL")}
                />
              </Badge>
            )}

            {activeLetter && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Letter: {activeLetter}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-600"
                  onClick={() => setActiveLetter(null)}
                />
              </Badge>
            )}

            {showCurrentTermOnly && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Current term only
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-600"
                  onClick={() => setShowCurrentTermOnly(false)}
                />
              </Badge>
            )}

            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Results */}
      <ResultsHeader
        totalCount={doorcards.length}
        filteredCount={filteredDoorcards.length}
        hasFilters={hasFilters}
      />

      <DoorcardGrid doorcards={filteredDoorcards} />
    </div>
  );
}
