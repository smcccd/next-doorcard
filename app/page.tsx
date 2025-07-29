"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type College } from "@/types/doorcard";
import { Search, Clock, MapPin, Calendar, Building2 } from "lucide-react";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { useSearchAutocomplete, type AutocompleteSuggestion } from "@/hooks/useSearchAutocomplete";
import { getAllDepartments, extractDepartmentFromText, getDepartmentName } from "@/lib/departments";
import { useActiveTerm } from "@/hooks/useActiveTerm";
import { isCurrentTerm, isPastTerm, formatTermDisplay } from "@/lib/active-term";
import { TermSeason } from "@prisma/client";

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
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showCurrentTermOnly, setShowCurrentTermOnly] = useState(true);

  // Get active term information
  const { activeTerm, isLoading: termLoading } = useActiveTerm();

  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Autocomplete suggestions
  const suggestions = useSearchAutocomplete(doorcards, searchTerm, showAutocomplete);

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

    // Filter by department
    if (selectedDepartment !== "ALL") {
      filtered = filtered.filter((dc) => {
        // Check department based on doorcard name or professor name
        const deptFromName = extractDepartmentFromText(dc.name);
        const deptFromDoorcardName = extractDepartmentFromText(dc.doorcardName);
        const deptFromUserName = extractDepartmentFromText(dc.user?.name || "");
        
        return deptFromName === selectedDepartment || 
               deptFromDoorcardName === selectedDepartment ||
               deptFromUserName === selectedDepartment;
      });
    }

    // Filter by current term only
    if (showCurrentTermOnly && activeTerm) {
      filtered = filtered.filter((dc) => {
        return dc.term === activeTerm.season && dc.year === parseInt(activeTerm.year);
      });
    }

    // Filter by search term (using debounced value)
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (dc) =>
          dc.name.toLowerCase().includes(term) ||
          dc.doorcardName.toLowerCase().includes(term) ||
          dc.user.name?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [doorcards, selectedCampus, selectedDepartment, showCurrentTermOnly, activeTerm, debouncedSearchTerm]);

  const handleDoorcardClick = (doorcard: PublicDoorcard) => {
    const username =
      doorcard.user?.username ||
      doorcard.user?.name?.toLowerCase().replace(/\s+/g, "-") ||
      "user";
    router.push(`/view/${username}`);
  };

  const handleAutocompleteSelect = (suggestion: AutocompleteSuggestion) => {
    if (suggestion.type === 'professor') {
      setSearchTerm(suggestion.value);
    } else if (suggestion.type === 'department') {
      setSelectedDepartment(suggestion.value);
      setSearchTerm(""); // Clear search when selecting department
    }
    setShowAutocomplete(false);
  };

  const handleSearchFocus = () => {
    setShowAutocomplete(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowAutocomplete(true);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 -mx-4 sm:-mx-6 lg:-mx-8 -my-10">
      {/* Full Viewport Width Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 dark:from-blue-800 dark:via-blue-900 dark:to-gray-900 w-screen -ml-[50vw] left-1/2">
        {/* Background Pattern - Light mode uses blue dots, dark mode uses white */}
        <div
          className="absolute inset-0 opacity-10 dark:opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        ></div>

        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 to-transparent dark:from-black/20"></div>

        {/* Hero Content */}
        <div className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center max-w-7xl mx-auto">
            <p className="text-base sm:text-lg lg:text-xl font-medium text-blue-100 dark:text-blue-200 mb-2 tracking-wide uppercase letter-spacing-wider">
              Office Hours & Contact Information
            </p>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-light text-white mb-4 leading-tight drop-shadow-lg tracking-tight"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontWeight: 300,
                letterSpacing: "-0.02em",
              }}
            >
              Find Your Professor
            </h1>
            <p className="text-sm sm:text-base lg:text-lg font-light text-blue-200 dark:text-blue-300 tracking-wide mb-2">
              San Mateo County Community College District
            </p>
            {activeTerm && (
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-full px-4 py-2">
                  <Calendar className="h-4 w-4 text-blue-200 dark:text-blue-300" />
                  <span className="text-sm font-medium text-blue-100 dark:text-blue-200">
                    {termLoading ? "Loading term..." : activeTerm.displayName}
                  </span>
                  {!termLoading && activeTerm.isFromDatabase && (
                    <span className="text-xs text-blue-300 dark:text-blue-400">
                      (Active)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Info Card in Hero */}
            {/* <div className="max-w-2xl mx-auto">
              <div className="bg-white/15 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-xl p-4 sm:p-6 text-left shadow-lg">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-white/25 dark:bg-white/20 rounded-lg flex items-center justify-center">
                    <Search className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base sm:text-lg mb-2">
                      Need to meet with a professor?
                    </h3>
                    <p className="text-blue-50 dark:text-blue-100 text-xs sm:text-sm leading-relaxed">
                      Find their office hours, location, and contact details.
                      Each faculty profile shows when they&apos;re available for
                      student meetings, their office number, and how to reach
                      them across our three campuses.
                    </p>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>

      {/* Content Section with proper spacing */}
      <div className="px-4 sm:px-6 lg:px-8 space-y-8 bg-gray-50 dark:bg-gray-900">
        {/* Search and Filter */}
        <div className="max-w-5xl mx-auto -mt-16">
          <Card className="border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 shadow-2xl relative z-10">
            <CardHeader className="pb-6 pt-8">
              <h2 className="font-bold leading-none tracking-tight flex items-center gap-3 text-xl sm:text-2xl">
                <Search className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                Search for Your Professor
              </h2>
              <p className="text-base text-gray-700 dark:text-gray-100 mt-2">
                Enter your professor&apos;s name, browse by campus, or filter by department
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <label htmlFor="professor-search" className="sr-only">
                    Search for professor
                  </label>
                  <Input
                    id="professor-search"
                    placeholder="Type professor's name (e.g., John Smith, Dr. Johnson)..."
                    aria-label="Search for professor by name"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    className="w-full text-lg py-4 px-5 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:border-gray-400 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-800 dark:placeholder:text-gray-300 rounded-lg shadow-sm"
                  />
                  <SearchAutocomplete
                    suggestions={suggestions}
                    isVisible={showAutocomplete}
                    onSelect={handleAutocompleteSelect}
                    onClose={() => setShowAutocomplete(false)}
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
                    <TabsList className="flex w-full h-12 bg-gray-100 dark:bg-gray-700 p-3  rounded-lg border-0">
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
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Department:
                  </p>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-full h-12 text-base bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="ALL">All Departments</SelectItem>
                      {getAllDepartments().map((dept) => (
                        <SelectItem key={dept.code} value={dept.code}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {activeTerm && (
                  <div>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Term:
                    </p>
                    <Tabs 
                      value={showCurrentTermOnly ? "current" : "all"} 
                      onValueChange={(value) => setShowCurrentTermOnly(value === "current")}
                    >
                      <TabsList className="flex w-full h-12 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg border-0">
                        <TabsTrigger
                          value="current"
                          className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm rounded-md transition-all duration-200 hover:text-gray-900 dark:hover:text-white"
                        >
                          {activeTerm.displayName} Only
                        </TabsTrigger>
                        <TabsTrigger
                          value="all"
                          className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm rounded-md transition-all duration-200 hover:text-gray-900 dark:hover:text-white"
                        >
                          All Terms
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                )}
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
                  {searchTerm || selectedCampus !== "ALL" || selectedDepartment !== "ALL" || showCurrentTermOnly
                    ? "Search Results"
                    : "All Faculty"}
                </span>
                <div className="flex items-center gap-2">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDoorcards.map((doorcard) => (
                    <Card
                      key={doorcard.id}
                      className="cursor-pointer hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-500 transition-all duration-200 border-2 hover:bg-blue-50/30 dark:hover:bg-blue-900/30 dark:bg-gray-700 dark:border-gray-400"
                      onClick={() => handleDoorcardClick(doorcard)}
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
                              <div className="flex items-center gap-2">
                                <span className="text-gray-700 dark:text-gray-100">
                                  {formatTermDisplay(doorcard.term as TermSeason, doorcard.year)}
                                </span>
                                {activeTerm && isCurrentTerm(doorcard.term as TermSeason, doorcard.year) && (
                                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    Current
                                  </Badge>
                                )}
                                {activeTerm && isPastTerm(doorcard.term as TermSeason, doorcard.year) && (
                                  <Badge variant="outline" className="text-xs px-2 py-0.5 text-gray-500 dark:text-gray-400">
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
                        <div className="hidden md:block space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">
                                {doorcard.name}
                              </h3>
                              {doorcard.doorcardName !== doorcard.name && (
                                <p className="text-xs text-gray-600 dark:text-gray-100 truncate">
                                  {doorcard.doorcardName}
                                </p>
                              )}
                            </div>
                            {doorcard.college && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-xs font-medium flex-shrink-0"
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

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-blue-400 dark:text-blue-400" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                Office {doorcard.officeNumber}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-green-500 dark:text-green-400" />
                              <span className="text-gray-700 dark:text-gray-100">
                                {doorcard.appointmentCount > 0
                                  ? `${doorcard.appointmentCount} hours`
                                  : "Hours posted"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-purple-500 dark:text-purple-400" />
                                <span className="text-gray-700 dark:text-gray-100">
                                  {formatTermDisplay(doorcard.term as TermSeason, doorcard.year)}
                                </span>
                              </div>
                              {activeTerm && isCurrentTerm(doorcard.term as TermSeason, doorcard.year) && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
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
