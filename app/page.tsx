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
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 dark:from-blue-800 dark:via-blue-900 dark:to-gray-900">
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-10" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        ></div>
        
        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {/* Hero Content */}
        <div className="relative px-6 py-16 sm:py-20 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Find Your Professor
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-4 leading-relaxed">
              Office Hours & Contact Information
            </p>
            <p className="text-blue-200 text-base sm:text-lg mb-8">
              San Mateo County Community College District
            </p>
            
            {/* Enhanced Info Card in Hero */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-left">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Search className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">
                      Need to meet with a professor?
                    </h3>
                    <p className="text-blue-100 text-sm leading-relaxed">
                      Find their office hours, location, and contact details. Each faculty profile shows
                      when they&apos;re available for student meetings, their office
                      number, and how to reach them across our three campuses.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="max-w-4xl mx-auto px-6">
        <Card className="border-2 border-blue-100 dark:border-blue-800 dark:bg-gray-800 shadow-lg -mt-8 relative z-10">
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
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-3">
                Filter by Campus:
              </p>
              <Tabs
                value={selectedCampus}
                onValueChange={(value) =>
                  setSelectedCampus(value as College | "ALL")
                }
              >
                <TabsList className="grid w-full grid-cols-4 h-14 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                  <TabsTrigger
                    value="ALL"
                    className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                  >
                    <span className="text-xs">📍</span>
                    All Campuses
                  </TabsTrigger>
                  <TabsTrigger
                    value="SKYLINE"
                    className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 data-[state=active]:shadow-md rounded-md transition-all duration-200"
                    title="Skyline College"
                  >
                    <CollegeLogo college="SKYLINE" height={16} />
                    Skyline
                  </TabsTrigger>
                  <TabsTrigger
                    value="CSM"
                    className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:bg-red-500 data-[state=active]:text-white dark:data-[state=active]:bg-red-600 data-[state=active]:shadow-md rounded-md transition-all duration-200"
                    title="College of San Mateo"
                  >
                    <CollegeLogo college="CSM" height={16} />
                    CSM
                  </TabsTrigger>
                  <TabsTrigger
                    value="CANADA"
                    className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:bg-green-500 data-[state=active]:text-white dark:data-[state=active]:bg-green-600 data-[state=active]:shadow-md rounded-md transition-all duration-200"
                    title="Cañada College"
                  >
                    <CollegeLogo college="CANADA" height={16} />
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
      <div className="max-w-4xl mx-auto px-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDoorcards.map((doorcard) => (
                <Card
                  key={doorcard.id}
                  className="cursor-pointer hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-500 transition-all duration-200 border-2 hover:bg-blue-50/30 dark:hover:bg-blue-900/30 dark:bg-gray-700 dark:border-gray-400"
                  onClick={() => handleDoorcardClick(doorcard)}
                >
                  <CardContent className="p-5">
                    <div className="space-y-4">
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
                              COLLEGE_FULL_NAMES[doorcard.college as College]
                            }
                          >
                            {COLLEGE_BADGE_NAMES[doorcard.college as College]}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2">
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
      <div className="max-w-4xl mx-auto px-6">
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
                    <strong>Before visiting:</strong> Check if your professor
                    requires appointments or has drop-in hours
                  </p>
                  <p>
                    <strong>Office locations:</strong> Allow extra time to find
                    offices, especially on your first visit
                  </p>
                  <p>
                    <strong>Contact info:</strong> Each professor&apos;s page
                    includes their preferred contact method
                  </p>
                  <p>
                    <strong>Schedule changes:</strong> Office hours may change
                    during finals week or holidays
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
