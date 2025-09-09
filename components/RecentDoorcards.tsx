"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PublicDoorcard } from "@/types/pages/public";
import { formatDisplayName } from "@/lib/display-name";
import { SimpleFacultyGrid } from "@/components/ui/simple-faculty-grid";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Clock,
  User,
  ChevronRight,
  ArrowUpDown,
  Filter,
} from "lucide-react";

const COLLEGE_COLORS = {
  CSM: "bg-blue-100 text-blue-800 border-blue-200",
  CANADA: "bg-green-100 text-green-800 border-green-200",
  SKYLINE: "bg-purple-100 text-purple-800 border-purple-200",
  DISTRICT_OFFICE: "bg-gray-100 text-gray-800 border-gray-200",
} as const;

const COLLEGE_NAMES = {
  CSM: "College of San Mateo",
  CANADA: "Cañada College",
  SKYLINE: "Skyline College",
  DISTRICT_OFFICE: "District Office",
} as const;

type SortField = "name" | "college" | "updatedAt" | "appointmentCount";
type SortDirection = "asc" | "desc";

interface RecentDoorcardsProps {
  initialDoorcards?: PublicDoorcard[];
  limit?: number;
  showTitle?: boolean;
  showFilter?: boolean;
}

export function RecentDoorcards({
  initialDoorcards = [],
  limit = 25,
  showTitle = true,
  showFilter = true,
}: RecentDoorcardsProps) {
  const router = useRouter();
  const [doorcards, setDoorcards] =
    useState<PublicDoorcard[]>(initialDoorcards);
  const [loading, setLoading] = useState(!initialDoorcards.length);
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [collegeFilter, setCollegeFilter] = useState<string>("ALL");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!initialDoorcards.length) {
      fetchDoorcards();
    }
  }, [initialDoorcards.length]);

  const fetchDoorcards = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/doorcards/recent");
      const data = await response.json();
      if (data.success) {
        setDoorcards(data.doorcards || []);
      } else {
        console.error("API returned error:", data.error);
        setDoorcards([]);
      }
    } catch (error) {
      console.error("Failed to fetch doorcards:", error);
      setDoorcards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedDoorcards = doorcards
    .filter(
      (doorcard) =>
        collegeFilter === "ALL" || doorcard.college === collegeFilter
    )
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case "name":
          aValue = a.user?.name || a.name || "";
          bValue = b.user?.name || b.name || "";
          break;
        case "college":
          aValue = a.college || "";
          bValue = b.college || "";
          break;
        case "updatedAt":
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case "appointmentCount":
          aValue = a.appointmentCount || 0;
          bValue = b.appointmentCount || 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    })
    .slice(0, limit);

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 font-medium text-left hover:text-smccd-blue-900 transition-colors"
      aria-label={`Sort by ${field}`}
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  // Handle click for simplified grid
  const handleDoorcardClick = (doorcard: PublicDoorcard) => {
    const username =
      doorcard.user?.username ||
      doorcard.user?.name?.toLowerCase().replace(/\s+/g, "-") ||
      "user";
    router.push(`/view/${username}`);
  };

  // Simplified grid view for homepage (when showFilter is false)
  if (!showFilter) {
    return (
      <SimpleFacultyGrid
        doorcards={filteredAndSortedDoorcards}
        loading={loading}
        onDoorcardClick={handleDoorcardClick}
      />
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-4">
        {(showTitle || showFilter) && (
          <div className="flex items-center justify-between">
            {showTitle && (
              <h2 className="text-xl font-bold text-gray-900">
                Recent Faculty Doorcards
              </h2>
            )}
            {showFilter && (
              <select
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                aria-label="Filter by college"
              >
                <option value="ALL">All Colleges</option>
                <option value="CSM">CSM</option>
                <option value="CANADA">Cañada</option>
                <option value="SKYLINE">Skyline</option>
                <option value="DISTRICT_OFFICE">District</option>
              </select>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedDoorcards.map((doorcard) => (
              <Card key={doorcard.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                    {formatDisplayName({
                      name: doorcard.user?.name || doorcard.name,
                      displayFormat: "FULL_NAME",
                    })}
                  </h3>
                  <Badge
                    variant="secondary"
                    className={`${COLLEGE_COLORS[doorcard.college as keyof typeof COLLEGE_COLORS] || COLLEGE_COLORS.DISTRICT_OFFICE} text-xs`}
                  >
                    {doorcard.college === "DISTRICT_OFFICE"
                      ? "District"
                      : doorcard.college}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>Office {doorcard.officeNumber || "TBA"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {doorcard.appointmentCount || 0} scheduled hours
                    </span>
                  </div>
                </div>

                <Link
                  href={
                    doorcard.user?.username
                      ? `/view/${doorcard.user.username}/current`
                      : `/view/${doorcard.slug}`
                  }
                  className="flex items-center justify-between text-smccd-blue-900 text-sm font-medium"
                >
                  View Office Hours
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="space-y-4">
      {(showTitle || showFilter) && (
        <div className="flex items-center justify-between">
          {showTitle && (
            <h2 className="text-2xl font-bold text-gray-900">
              Recent Faculty Doorcards
            </h2>
          )}
          {showFilter && (
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-smccd-blue-500 focus:border-smccd-blue-500"
                aria-label="Filter by college"
              >
                <option value="ALL">All Colleges</option>
                <option value="CSM">College of San Mateo</option>
                <option value="CANADA">Cañada College</option>
                <option value="SKYLINE">Skyline College</option>
                <option value="DISTRICT_OFFICE">District Office</option>
              </select>
            </div>
          )}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="min-w-full"
            role="table"
            aria-label="Recent faculty doorcards"
          >
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-sm font-medium text-gray-900"
                >
                  <SortButton field="name">Faculty Name</SortButton>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-sm font-medium text-gray-900"
                >
                  <SortButton field="college">College</SortButton>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-sm font-medium text-gray-900"
                >
                  Office
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-sm font-medium text-gray-900"
                >
                  <SortButton field="appointmentCount">Hours</SortButton>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-sm font-medium text-gray-900"
                >
                  Term
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-sm font-medium text-gray-900 hidden lg:table-cell"
                >
                  <SortButton field="updatedAt">Updated</SortButton>
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 bg-gray-200 rounded w-24"></div>
                    </td>
                  </tr>
                ))
              ) : filteredAndSortedDoorcards.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No doorcards found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredAndSortedDoorcards.map((doorcard) => (
                  <tr
                    key={doorcard.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDisplayName({
                          name: doorcard.user?.name || doorcard.name,
                          displayFormat: "FULL_NAME",
                        })}
                      </div>
                      {doorcard.doorcardName &&
                        doorcard.doorcardName !==
                          (doorcard.user?.name || doorcard.name) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {doorcard.doorcardName}
                          </div>
                        )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${COLLEGE_COLORS[doorcard.college as keyof typeof COLLEGE_COLORS] || COLLEGE_COLORS.DISTRICT_OFFICE}`}
                      >
                        {COLLEGE_NAMES[
                          doorcard.college as keyof typeof COLLEGE_NAMES
                        ] || doorcard.college}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate max-w-[120px]">
                          {doorcard.officeNumber || "TBA"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                      {doorcard.appointmentCount || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {doorcard.term} {doorcard.year}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                      {new Date(doorcard.updatedAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={
                            doorcard.user?.username
                              ? `/view/${doorcard.user.username}/current`
                              : `/view/${doorcard.slug}`
                          }
                          className="flex items-center gap-1"
                        >
                          View
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredAndSortedDoorcards.length === limit && (
        <div className="text-center">
          <Button asChild variant="outline">
            <Link href="/browse">
              View All Faculty Doorcards
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
