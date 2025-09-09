"use client";

import React, { useState } from "react";
import { Grid, List, Printer } from "lucide-react";
import { SemanticSchedule } from "./SemanticSchedule";
import type { DoorcardLite } from "@/lib/doorcard/types";

interface DoorcardContainerProps {
  doorcard: DoorcardLite;
  showWeekendDays?: boolean;
  containerId?: string;
  defaultView?: "calendar" | "list" | "print";
  showViewToggle?: boolean;
}

type ViewType = "calendar" | "list" | "print";

/**
 * Container component that manages view state and provides view switching
 * Maintains backward compatibility with existing UnifiedDoorcard props
 */
export function DoorcardContainer({
  doorcard,
  showWeekendDays = false,
  containerId = "doorcard-schedule",
  defaultView = "calendar",
  showViewToggle = true,
}: DoorcardContainerProps) {
  const [viewType, setViewType] = useState<ViewType>(defaultView);

  // Check if any appointments fall on weekends for auto-detection
  const hasWeekendAppointments = doorcard.appointments.some(
    (apt) => apt.dayOfWeek === "SATURDAY" || apt.dayOfWeek === "SUNDAY"
  );

  // Override showWeekendDays if weekend appointments exist
  const effectiveShowWeekends = showWeekendDays || hasWeekendAppointments;

  const getViewModeForSemantic = () => {
    return viewType === "print" ? "print" : "screen";
  };

  return (
    <div id={containerId} className="doorcard-container space-y-4">
      {/* View Toggle Controls */}
      {showViewToggle && (
        <div className="flex items-center gap-2 print:hidden mb-4">
          <button
            onClick={() => setViewType("calendar")}
            className={`p-2 rounded-md transition-colors ${
              viewType === "calendar"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
            title="Calendar view"
            aria-pressed={viewType === "calendar"}
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={() => setViewType("list")}
            className={`p-2 rounded-md transition-colors ${
              viewType === "list"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
            title="List view"
            aria-pressed={viewType === "list"}
          >
            <List className="w-4 h-4" />
          </button>

          <button
            onClick={() => setViewType("print")}
            className={`p-2 rounded-md transition-colors ${
              viewType === "print"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
            title="Print preview"
            aria-pressed={viewType === "print"}
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Semantic Schedule Component - Let it handle its own styling */}
      <SemanticSchedule
        doorcard={doorcard}
        viewMode={getViewModeForSemantic()}
        showWeekends={effectiveShowWeekends}
        containerId={`${containerId}-semantic`}
      />
    </div>
  );
}

export default DoorcardContainer;
