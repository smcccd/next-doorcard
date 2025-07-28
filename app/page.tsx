"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type College } from "@/types/doorcard";
import { Search, Clock, MapPin, Calendar } from "lucide-react";
import CollegeLogo from "@/components/CollegeLogo";

// Custom hook for debounced values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
// College display names for badges and tabs
const COLLEGE_BADGE_NAMES: Record<College, string> = {
  CSM: "CSM",
  SKYLINE: "Skyline",
  CANADA: "Cañada",
};

const COLLEGE_FULL_NAMES: Record<College, string> = {
  CSM: "College of San Mateo",
  SKYLINE: "Skyline College",
  CANADA: "Cañada College",
};

import type {
  PublicDoorcard,
  PublicDoorcardResponse as DoorcardResponse,
} from "@/types/pages/public";

export default function Home() {
  const router = useRouter();
  const [doorcards, setDoorcards] = useState<PublicDoorcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampus, setSelectedCampus] = useState<College | "ALL">("ALL");

  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

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

  // Memoized filtered doorcards using debounced search
  const filteredDoorcards = useMemo(() => {
    let filtered = doorcards;

    // Filter by campus
    if (selectedCampus !== "ALL") {
      filtered = filtered.filter((dc) => dc.college === selectedCampus);
    }

    // Filter by search term (using debounced value)
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (dc) =>
          dc.name.toLowerCase().includes(term) ||
          dc.doorcardName.toLowerCase().includes(term) ||
          dc.user.name?.toLowerCase().includes(term),
      );
    }

    return filtered;
  }, [doorcards, selectedCampus, debouncedSearchTerm]);

  const handleDoorcardClick = (doorcard: PublicDoorcard) => {
    const username =
      doorcard.user?.username ||
      doorcard.user?.name?.toLowerCase().replace(/\s+/g, "-") ||
      "user";
    router.push(`/view/${username}`);
  };

  return (
    <div>
      {/* Content Section with proper spacing */}
      <div className="px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Search and Filter */}
        <div className="max-w-4xl mx-auto -mt-8">
          <Card className="border-2 border-blue-100 dark:border-blue-800 dark:bg-gray-800 shadow-lg relative z-10">
            <CardHeader className="pb-4">
              <h2 className="font-semibold leading-none tracking-tight flex items-center gap-2 text-lg">
                <Search className="h-5 w-5 text-blue-400 dark:text-blue-400" />
                Search for Your Professor
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-100 mt-1">
                Enter your professor&apos;s name or browse by campus
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="professor-search" className="sr-only">
                    Search for professor
                  </label>
                  <Input
                    id="professor-search"
                    placeholder="Type professor's name (e.g., John Smith, Dr. Johnson)..."
                    aria-label="Search for professor by name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-base py-3 px-4 border-2 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-400 dark:text-gray-100 dark:focus:border-blue-400 dark:placeholder:text-gray-300"
                  />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Campus:
                  </p>
                  <Tabs
                    value={selectedCampus}
                    onValueChange={(value) =>
                      setSelectedCampus(value as College | "ALL")
                    }
                  >
                    <TabsList className="flex w-full h-12 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg border-0">
                      <TabsTrigger
                        value="ALL"
                        className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm rounded-md transition-all duration-200 hover:text-gray-900 dark:hover:text-white"
                      >
                        All Campuses
                      </TabsTrigger>
                      <TabsTrigger
                        value="SKYLINE"
                        className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm rounded-md transition-all duration-200 hover:text-gray-900 dark:hover:text-white"
                        title="Skyline College"
                      >
                        Skyline
                      </TabsTrigger>
                      <TabsTrigger
                        value="CSM"
                        className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm rounded-md transition-all duration-200 hover:text-gray-900 dark:hover:text-white"
                        title="College of San Mateo"
                      >
                        CSM
                      </TabsTrigger>
                      <TabsTrigger
                        value="CANADA"
                        className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm rounded-md transition-all duration-200 hover:text-gray-900 dark:hover:text-white"
                        title="Cañada College"
                      >
                        Cañada
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Directory */}
        <div className="max-w-4xl mx-auto">
          <Card className="dark:bg-gray-800">
            <CardHeader>
              <h2 className="font-semibold leading-none tracking-tight flex items-center justify-between text-xl">
                <span>
                  {searchTerm || selectedCampus !== "ALL"
                    ? "Search Results"
                    : "All Faculty"}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {filteredDoorcards.length} professor
                    {filteredDoorcards.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </h2>
              {!loading && filteredDoorcards.length > 0 && (
                <p className="text-sm text-gray-700 dark:text-gray-100 mt-1">
                  Click on any professor to view their office hours and contact
                  information
                </p>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-700 dark:text-gray-100 mt-3">
                    Finding professors...
                  </p>
                </div>
              ) : filteredDoorcards.length === 0 ? (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredDoorcards.map((doorcard) => (
                    <Card
                      key={doorcard.id}
                      className="cursor-pointer hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-500 transition-all duration-200 border-2 hover:bg-blue-50/30 dark:hover:bg-blue-900/30 dark:bg-gray-700 dark:border-gray-400"
                      onClick={() => handleDoorcardClick(doorcard)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
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
                                className="ml-2 text-xs font-medium"
                                title={
                                  COLLEGE_FULL_NAMES[
                                    doorcard.college as College
                                  ]
                                }
                              >
                                {
                                  COLLEGE_BADGE_NAMES[
                                    doorcard.college as College
                                  ]
                                }
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
                              <span className="text-gray-700 dark:text-gray-100">
                                {doorcard.term} {doorcard.year}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              Click to view schedule and contact info →
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Helpful Tips */}
        <div className="max-w-4xl mx-auto">
          {!loading && filteredDoorcards.length > 0 && (
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-700 dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 dark:bg-green-800/80 p-2 rounded-full flex-shrink-0">
                    <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      💡 Student Tips
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <p>
                        <strong>Before visiting:</strong> Check if your
                        professor requires appointments or has drop-in hours
                      </p>
                      <p>
                        <strong>Office locations:</strong> Allow extra time to
                        find offices, especially on your first visit
                      </p>
                      <p>
                        <strong>Contact info:</strong> Each professor&apos;s
                        page includes their preferred contact method
                      </p>
                      <p>
                        <strong>Schedule changes:</strong> Office hours may
                        change during finals week or holidays
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
