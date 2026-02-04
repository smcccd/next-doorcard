"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Calendar } from "lucide-react";
import { PublicDoorcard } from "@/types/pages/public";
import { College } from "@/types/doorcard";
import CollegeLogo from "@/components/logos/CollegeLogo";
import { TermSeason } from "@prisma/client";
import {
  isCurrentTerm,
  isPastTerm,
  formatTermDisplay,
} from "@/lib/term/active-term";
import { ActiveTermInfo } from "@/lib/term/active-term";

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

interface ProfessorCardProps {
  doorcard: PublicDoorcard;
  activeTerm: ActiveTermInfo | null;
  onClick: (doorcard: PublicDoorcard) => void;
}

export function ProfessorCard({
  doorcard,
  activeTerm,
  onClick,
}: ProfessorCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-500 transition-all duration-200 border-2 hover:bg-blue-50/30 dark:hover:bg-blue-900/30 dark:bg-gray-700 dark:border-gray-400"
      onClick={() => onClick(doorcard)}
      data-testid="professor-card"
      role="article"
    >
      <CardContent className="p-4">
        {/* Mobile Layout (Full Details) */}
        <div className="md:hidden space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                {doorcard.name}
              </h3>
              {doorcard.doorcardName !== doorcard.name && (
                <p className="text-sm text-gray-600 dark:text-gray-100 mb-2">
                  {doorcard.doorcardName}
                </p>
              )}
            </div>
            {doorcard.college && (
              <Badge
                variant="outline"
                className="ml-2 text-xs font-medium flex items-center gap-1.5"
                title={COLLEGE_FULL_NAMES[doorcard.college as College]}
              >
                <CollegeLogo
                  college={doorcard.college as College}
                  height={16}
                  className="flex-shrink-0"
                />
                {COLLEGE_BADGE_NAMES[doorcard.college as College]}
              </Badge>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-blue-400 dark:text-blue-400 flex-shrink-0" />
              <span className="font-medium text-gray-900 dark:text-white">
                Office {doorcard.officeNumber}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-100">
                {doorcard.appointmentCount > 0
                  ? `${doorcard.appointmentCount} office hour${
                      doorcard.appointmentCount !== 1 ? "s" : ""
                    } available`
                  : "Office hours posted"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-gray-700 dark:text-gray-100">
                  {formatTermDisplay(
                    doorcard.term as TermSeason,
                    doorcard.year
                  )}
                </span>
                {activeTerm &&
                  isCurrentTerm(doorcard.term as TermSeason, doorcard.year) && (
                    <Badge
                      variant="secondary"
                      className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    >
                      Current
                    </Badge>
                  )}
                {activeTerm &&
                  isPastTerm(doorcard.term as TermSeason, doorcard.year) && (
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-0.5 text-gray-500 dark:text-gray-400"
                    >
                      Past
                    </Badge>
                  )}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-600">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Click to view schedule and contact info →
            </p>
          </div>
        </div>

        {/* Desktop Layout (Compact) */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">
                {doorcard.name}
              </h3>
              {doorcard.doorcardName !== doorcard.name && (
                <p className="text-sm text-gray-600 dark:text-gray-100 truncate">
                  {doorcard.doorcardName}
                </p>
              )}
            </div>
            {doorcard.college && (
              <Badge
                variant="outline"
                className="ml-2 text-xs font-medium flex-shrink-0 flex items-center gap-1.5"
                title={COLLEGE_FULL_NAMES[doorcard.college as College]}
              >
                <CollegeLogo
                  college={doorcard.college as College}
                  height={14}
                  className="flex-shrink-0"
                />
                {COLLEGE_BADGE_NAMES[doorcard.college as College]}
              </Badge>
            )}
          </div>

          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-3 w-3 text-blue-400 dark:text-blue-400 flex-shrink-0" />
              <span className="font-medium text-gray-900 dark:text-white">
                Office {doorcard.officeNumber}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3 w-3 text-green-500 dark:text-green-400 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-100">
                {doorcard.appointmentCount > 0
                  ? `${doorcard.appointmentCount} office hour${
                      doorcard.appointmentCount !== 1 ? "s" : ""
                    }`
                  : "Hours posted"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-purple-500 dark:text-purple-400" />
                <span className="text-gray-700 dark:text-gray-100">
                  {formatTermDisplay(
                    doorcard.term as TermSeason,
                    doorcard.year
                  )}
                </span>
              </div>
              {activeTerm &&
                isCurrentTerm(doorcard.term as TermSeason, doorcard.year) && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  >
                    Current
                  </Badge>
                )}
            </div>
            <span className="text-gray-500 dark:text-gray-400">
              Click to view →
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
