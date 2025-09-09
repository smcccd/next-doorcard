"use client";

import { PublicDoorcard } from "@/types/pages/public";
import { SimpleFacultyCard } from "./simple-faculty-card";

interface SimpleFacultyGridProps {
  doorcards: PublicDoorcard[];
  loading: boolean;
  onDoorcardClick: (doorcard: PublicDoorcard) => void;
}

export function SimpleFacultyGrid({
  doorcards,
  loading,
  onDoorcardClick,
}: SimpleFacultyGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (doorcards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">No faculty found</p>
          <p className="text-sm">
            Try adjusting your search or selecting a different campus
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {doorcards.map((doorcard, index) => (
          <div
            key={doorcard.id}
            onClick={() => onDoorcardClick(doorcard)}
            className={`group grid grid-cols-[2fr,auto,1fr,2fr] gap-4 items-center px-4 py-4 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
              index !== doorcards.length - 1
                ? "border-b border-gray-200 dark:border-gray-700"
                : ""
            }`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onDoorcardClick(doorcard);
              }
            }}
            aria-label={`View office hours for ${doorcard.user.name} at ${doorcard.college}`}
          >
            {/* Faculty Info */}
            <div className="min-w-0 flex items-center gap-2">
              <h3 className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-smccd-blue-700 dark:group-hover:text-smccd-blue-400 transition-colors truncate">
                {doorcard.user.name}
              </h3>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {doorcard.officeNumber || "TBA"}
              </span>
            </div>

            {/* Campus Badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                doorcard.college === "CSM"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : doorcard.college === "SKYLINE"
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              }`}
            >
              {doorcard.college === "CSM"
                ? "CSM"
                : doorcard.college === "SKYLINE"
                  ? "Skyline"
                  : doorcard.college === "CANADA"
                    ? "Cañada"
                    : doorcard.college}
            </span>

            {/* Schedule Hours */}
            <div className="flex items-center justify-center h-full">
              {doorcard.appointmentCount > 0 ? (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {doorcard.appointmentCount} hours/week
                </span>
              ) : (
                <span className="text-sm text-gray-400 dark:text-gray-500">
                  No hours
                </span>
              )}
            </div>

            {/* Available Days */}
            <div className="flex items-center justify-end gap-1">
              {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"].map(
                (day) => {
                  const dayAbbrev: Record<string, string> = {
                    MONDAY: "M",
                    TUESDAY: "T",
                    WEDNESDAY: "W",
                    THURSDAY: "Th",
                    FRIDAY: "F",
                  };
                  const hasOfficeHours =
                    doorcard.availableDays?.includes(day as any) ?? false;

                  return (
                    <div
                      key={day}
                      className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
                        hasOfficeHours
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                      }`}
                      title={
                        hasOfficeHours
                          ? `Available ${day.toLowerCase()}`
                          : `Not available ${day.toLowerCase()}`
                      }
                    >
                      {dayAbbrev[day]}
                    </div>
                  );
                }
              )}

              {/* Action indicator */}
              <svg
                className="w-4 h-4 ml-2 text-gray-400 group-hover:text-smccd-blue-600 dark:group-hover:text-smccd-blue-400 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
