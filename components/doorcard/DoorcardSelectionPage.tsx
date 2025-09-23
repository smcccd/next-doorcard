"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import CollegeLogo from "@/components/CollegeLogo";
import { formatDisplayName } from "@/lib/display-name";
import { College } from "@/types/doorcard";
import {
  User,
  MapPin,
  Calendar,
  Clock,
  Globe,
  ExternalLink,
  Users,
} from "lucide-react";

interface DoorcardSelectionPageProps {
  username: string;
  doorcards: any[];
  user: any;
  useAuth: boolean;
}

function getCollegeName(college: string): string {
  switch (college) {
    case "SKYLINE":
      return "Skyline College";
    case "CSM":
      return "College of San Mateo";
    case "CANADA":
      return "Cañada College";
    case "DISTRICT_OFFICE":
      return "District Office";
    default:
      return college;
  }
}

function getTermDisplayName(term: string, year: number): string {
  const termMap: Record<string, string> = {
    FALL: "Fall",
    SPRING: "Spring",
    SUMMER: "Summer",
  };
  return `${termMap[term] || term} ${year}`;
}

export function DoorcardSelectionPage({
  username,
  doorcards,
  user,
  useAuth,
}: DoorcardSelectionPageProps) {
  // Group doorcards by college for better organization
  const doorcardsByCollege = doorcards.reduce(
    (acc, doorcard) => {
      const college = doorcard.college;
      if (!acc[college]) {
        acc[college] = [];
      }
      acc[college].push(doorcard);
      return acc;
    },
    {} as Record<string, any[]>
  );

  const userName = user ? formatDisplayName(user) : username;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <User className="h-6 w-6 text-gray-600" />
              <h1 className="text-3xl font-bold text-gray-900">{userName}</h1>
            </div>
            <p className="text-lg text-gray-600 mb-1">
              Multiple Doorcards Available
            </p>
            <p className="text-sm text-gray-500">
              Select a doorcard to view the schedule
            </p>
            {useAuth && (
              <Badge variant="outline" className="mt-2">
                Admin View
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Doorcard Selection Grid */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {Object.entries(doorcardsByCollege).map(
            ([college, collegeDoorcards]) => (
              <div key={college} className="space-y-4">
                {/* College Header */}
                <div className="flex items-center gap-3">
                  <CollegeLogo
                    college={college as College}
                    height={24}
                    className="flex-shrink-0"
                  />
                  <h2 className="text-xl font-semibold text-gray-800">
                    {getCollegeName(college)}
                  </h2>
                  <div className="h-px bg-gray-300 flex-1"></div>
                </div>

                {/* Doorcards for this college */}
                <div
                  className={`grid gap-4 ${
                    (collegeDoorcards as any[]).length === 1
                      ? "grid-cols-1"
                      : (collegeDoorcards as any[]).length === 2
                        ? "md:grid-cols-2"
                        : "md:grid-cols-2 lg:grid-cols-3"
                  }`}
                >
                  {(collegeDoorcards as any[]).map((doorcard: any) => (
                    <Card
                      key={doorcard.id}
                      className="hover:shadow-md transition-shadow cursor-pointer group"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {doorcard.doorcardName ||
                                `${userName}'s Doorcard`}
                            </h3>
                            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {getTermDisplayName(
                                  doorcard.term,
                                  doorcard.year
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            {doorcard.isActive && (
                              <Badge
                                variant="default"
                                className="text-xs bg-green-100 text-green-800"
                              >
                                Live
                              </Badge>
                            )}
                            {!doorcard.isPublic && (
                              <Badge
                                variant="outline"
                                className="text-xs border-amber-200 text-amber-700"
                              >
                                Private
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {/* Office Info */}
                          {doorcard.officeNumber && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>Office {doorcard.officeNumber}</span>
                            </div>
                          )}

                          {/* Appointment Count */}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>
                              {doorcard.Appointment?.length || 0} scheduled{" "}
                              {(doorcard.Appointment?.length || 0) === 1
                                ? "appointment"
                                : "appointments"}
                            </span>
                          </div>

                          {/* Website Link */}
                          {doorcard.User?.website && (
                            <div className="flex items-center gap-2 text-sm">
                              <Globe className="h-4 w-4 text-gray-400" />
                              <a
                                href={
                                  doorcard.User.website.startsWith("http")
                                    ? doorcard.User.website
                                    : `https://${doorcard.User.website}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline truncate"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Faculty Website
                                <ExternalLink className="h-3 w-3 inline ml-1" />
                              </a>
                            </div>
                          )}

                          {/* View Button */}
                          <div className="pt-2">
                            <Button asChild className="w-full" size="sm">
                              <Link
                                href={`/view/${username}/${doorcard.college.toLowerCase()}-${doorcard.term.toLowerCase()}-${doorcard.year}${useAuth ? "?auth=true" : ""}`}
                                className="flex items-center justify-center gap-2"
                              >
                                <Users className="h-4 w-4" />
                                View Schedule
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Showing {doorcards.length} active doorcard
            {doorcards.length !== 1 ? "s" : ""}
          </p>
          <Button variant="outline" asChild>
            <Link href="/">Browse All Doorcards</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
