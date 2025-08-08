"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";
import { PublicDoorcard } from "@/types/pages/public";
import { College } from "@/types/doorcard";
import CollegeLogo from "@/components/CollegeLogo";

// College display names for badges
const COLLEGE_BADGE_NAMES: Record<College, string> = {
  CSM: "CSM",
  SKYLINE: "Skyline",
  CANADA: "Cañada",
  DISTRICT_OFFICE: "District",
};

const COLLEGE_FULL_NAMES: Record<College, string> = {
  CSM: "College of San Mateo",
  SKYLINE: "Skyline College",
  CANADA: "Cañada College",
  DISTRICT_OFFICE: "SMCCD District Office",
};

interface SimpleFacultyCardProps {
  doorcard: PublicDoorcard;
  onClick: (doorcard: PublicDoorcard) => void;
}

export function SimpleFacultyCard({
  doorcard,
  onClick,
}: SimpleFacultyCardProps) {
  const username =
    doorcard.user?.username ||
    doorcard.user?.name?.toLowerCase().replace(/\s+/g, "-") ||
    "user";

  return (
    <Card
      className="cursor-pointer hover:shadow-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 transition-all duration-200 focus-within:ring-2 focus-within:ring-smccd-blue-500 focus-within:ring-offset-2 hover:border-smccd-blue-400"
      onClick={() => onClick(doorcard)}
      data-testid="simple-faculty-card"
      role="article"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(doorcard);
        }
      }}
      aria-label={`View office hours for ${doorcard.user.name} at ${doorcard.college}`}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Faculty Name - Hero */}
          <div className="text-center">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">
              {doorcard.user.name}
            </h3>
            {doorcard.college && (
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                {COLLEGE_BADGE_NAMES[doorcard.college as College]}
              </span>
            )}
          </div>

          {/* Office - Most Important for Students */}
          <div className="bg-smccd-blue-50 dark:bg-smccd-blue-900/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <MapPin
                className="h-5 w-5 text-smccd-blue-600 dark:text-smccd-blue-400"
                aria-hidden="true"
              />
              <span className="font-bold text-lg text-smccd-blue-900 dark:text-smccd-blue-100">
                {doorcard.officeNumber || "TBA"}
              </span>
            </div>
          </div>

          {/* Office Hours Days */}
          {doorcard.availableDays && doorcard.availableDays.length > 0 && (
            <div className="text-center">
              <div className="flex justify-center gap-1">
                {doorcard.availableDays.map((day) => {
                  const dayAbbreviations: Record<string, string> = {
                    MONDAY: "M",
                    TUESDAY: "T",
                    WEDNESDAY: "W",
                    THURSDAY: "Th",
                    FRIDAY: "F",
                    SATURDAY: "Sa",
                    SUNDAY: "Su",
                  };
                  const abbrev = dayAbbreviations[day] || day.charAt(0);
                  return (
                    <span
                      key={day}
                      className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                      title={`Office hours on ${day.charAt(0) + day.slice(1).toLowerCase()}`}
                    >
                      {abbrev}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
