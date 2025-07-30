"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { PublicDoorcard } from "@/types/pages/public";
import { College } from "@/types/doorcard";
import { ActiveTermInfo } from "@/lib/active-term";
import { getDepartmentName } from "@/lib/departments";
import { ProfessorCard } from "./professor-card";
import { ProfessorSkeleton } from "./professor-skeleton";
import { DayOfWeek } from "@prisma/client";

// College display names for badges
const COLLEGE_BADGE_NAMES: Record<College, string> = {
  CSM: "CSM",
  SKYLINE: "Skyline",
  CANADA: "Cañada",
};

interface ProfessorGridProps {
  doorcards: PublicDoorcard[];
  loading: boolean;
  activeTerm: ActiveTermInfo | null;
  activeLetter: string | null;
  hasActiveFilters: boolean;
  selectedDay: DayOfWeek | "ALL";
  selectedDepartment: string;
  selectedCampus: College | "ALL";
  searchTerm: string;
  onDoorcardClick: (doorcard: PublicDoorcard) => void;
}

export function ProfessorGrid({
  doorcards,
  loading,
  activeTerm,
  activeLetter,
  hasActiveFilters,
  selectedDay,
  selectedDepartment,
  selectedCampus,
  searchTerm,
  onDoorcardClick,
}: ProfessorGridProps) {
  const getHeaderTitle = () => {
    if (activeLetter) {
      return `Professors: ${activeLetter}`;
    }
    if (hasActiveFilters) {
      return "Search Results";
    }
    return "Recent Door Cards";
  };

  const getHeaderDescription = () => {
    if (hasActiveFilters) {
      return "Click on any professor to view their office hours and contact information";
    }
    return `Showing ${activeTerm ? activeTerm.displayName : "current term"} professors with the most office hours. Use the search above to find specific faculty.`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <h2 className="font-semibold leading-none tracking-tight flex items-center justify-between text-xl">
            <span>{getHeaderTitle()}</span>
            <div className="flex items-center gap-2">
              {activeLetter && (
                <Badge
                  variant="default"
                  className="text-xs bg-blue-600 text-white"
                >
                  Last name: {activeLetter}*
                </Badge>
              )}
              {selectedDay !== "ALL" && (
                <Badge
                  variant="default"
                  className="text-xs bg-green-600 text-white"
                >
                  Available:{" "}
                  {selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase()}
                </Badge>
              )}
              {selectedDepartment !== "ALL" && (
                <Badge variant="outline" className="text-xs">
                  {getDepartmentName(selectedDepartment)}
                </Badge>
              )}
              {selectedCampus !== "ALL" && (
                <Badge variant="outline" className="text-xs">
                  {COLLEGE_BADGE_NAMES[selectedCampus]}
                </Badge>
              )}
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {doorcards.length} professor{doorcards.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </h2>
          {!loading && doorcards.length > 0 && (
            <p className="text-sm text-gray-700 dark:text-gray-100 mt-1">
              {getHeaderDescription()}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <ProfessorSkeleton />
          ) : doorcards.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No professors found
                </h3>
                <p className="text-gray-700 dark:text-gray-100 mb-4">
                  {searchTerm
                    ? `No professors match "${searchTerm}"`
                    : "No professors available for the selected campus"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-200">
                  Try adjusting your search or selecting a different campus
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doorcards.map((doorcard) => (
                <ProfessorCard
                  key={doorcard.id}
                  doorcard={doorcard}
                  activeTerm={activeTerm}
                  onClick={onDoorcardClick}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
