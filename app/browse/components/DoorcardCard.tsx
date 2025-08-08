"use client";

import { PublicDoorcard } from "@/types/pages/public";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MapPin, Calendar, Clock, User, ExternalLink } from "lucide-react";
import { formatDisplayName } from "@/lib/display-name";
import {
  DAY_SHORT_ABBREV,
  sortDaysByCalendarOrder,
} from "@/lib/doorcard-constants";

interface DoorcardCardProps {
  doorcard: PublicDoorcard;
}

const COLLEGE_COLORS = {
  CSM: "bg-blue-100 text-blue-800",
  CANADA: "bg-green-100 text-green-800",
  SKYLINE: "bg-purple-100 text-purple-800",
  DISTRICT_OFFICE: "bg-gray-100 text-gray-800",
} as const;

export function DoorcardCard({ doorcard }: DoorcardCardProps) {
  const viewUrl = doorcard.user?.username
    ? `/view/${doorcard.user.username}/current`
    : `/view/${doorcard.slug}`;

  const collegeColorClass = doorcard.college
    ? COLLEGE_COLORS[doorcard.college as keyof typeof COLLEGE_COLORS] ||
      COLLEGE_COLORS.DISTRICT_OFFICE
    : COLLEGE_COLORS.DISTRICT_OFFICE;

  const displayName = formatDisplayName({
    name: doorcard.user?.name || doorcard.name,
    displayFormat: "FULL_NAME",
  });

  return (
    <Card className="h-full flex flex-col p-6 hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500">
      {/* Header - Fixed Height */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 leading-tight line-clamp-2 min-h-[3.5rem]">
            {doorcard.doorcardName || displayName}
          </h3>
          {doorcard.college && (
            <Badge
              variant="secondary"
              className={`${collegeColorClass} flex-shrink-0 ml-2`}
            >
              {doorcard.college === "DISTRICT_OFFICE"
                ? "District"
                : doorcard.college}
            </Badge>
          )}
        </div>

        {/* Professor Name - Always show space for consistency */}
        <div className="min-h-[1.25rem]">
          {doorcard.doorcardName !== displayName && (
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <User className="h-3 w-3" />
              {displayName}
            </p>
          )}
        </div>
      </div>

      {/* Content - Flexible but structured */}
      <div className="flex-1 space-y-3">
        {/* Office Information - Always show */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span>Office {doorcard.officeNumber || "TBA"}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span>
              {doorcard.term} {doorcard.year}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span>
              {doorcard.appointmentCount > 0
                ? `${doorcard.appointmentCount} scheduled hours`
                : "Hours available"}
            </span>
          </div>
        </div>

        {/* Available Days - Fixed height section */}
        <div className="min-h-[3rem]">
          <p className="text-xs text-gray-500 mb-1">Available days:</p>
          <div className="flex gap-1 flex-wrap">
            {doorcard.availableDays && doorcard.availableDays.length > 0 ? (
              sortDaysByCalendarOrder(doorcard.availableDays).map((day) => (
                <Badge
                  key={day}
                  variant="outline"
                  className="h-6 w-6 p-0 flex items-center justify-center text-xs"
                >
                  {DAY_SHORT_ABBREV[day]}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-gray-400">
                Check schedule for details
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Always at bottom */}
      <div className="mt-4 pt-4 border-t space-y-3">
        <Button asChild className="w-full" variant="default">
          <Link
            href={viewUrl}
            className="flex items-center justify-center gap-2"
          >
            View Office Hours
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>

        <div className="text-xs text-gray-400 text-center">
          Updated {new Date(doorcard.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </Card>
  );
}
