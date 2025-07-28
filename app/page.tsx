"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COLLEGES, type College } from "@/types/doorcard";
import { Search, Clock, MapPin, Calendar } from "lucide-react";

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
          dc.user.name?.toLowerCase().includes(term)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mt-5 text-gray-900">
          Find Your Professor
        </h1>
        <p className="text-xl text-gray-600 mt-2">
          Office Hours & Contact Information
        </p>
        <p className="text-gray-500 text-sm mt-1">
          San Mateo County Community College District
        </p>
        <div className="mt-6 max-w-3xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-gray-700 text-sm leading-relaxed">
              <strong>Need to meet with a professor?</strong> Find their office hours, location, and contact details. 
              Each faculty profile shows when they're available for student meetings, their office number, 
              and how to reach them across our three campuses.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="border-2 border-blue-100">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-blue-600" />
            Search for Your Professor
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Enter your professor's name or browse by campus
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Type professor's name (e.g., John Smith, Dr. Johnson)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-base py-3 px-4 border-2 focus:border-blue-500"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Filter by Campus:</p>
              <Tabs
                value={selectedCampus}
                onValueChange={(value) =>
                  setSelectedCampus(value as College | "ALL")
                }
              >
                <TabsList className="grid w-full grid-cols-4 h-12">
                  <TabsTrigger value="ALL" className="text-sm font-medium">All Campuses</TabsTrigger>
                  <TabsTrigger value="SKYLINE" className="text-sm font-medium" title="Skyline College">Skyline</TabsTrigger>
                  <TabsTrigger value="CSM" className="text-sm font-medium" title="College of San Mateo">CSM</TabsTrigger>
                  <TabsTrigger value="CANADA" className="text-sm font-medium" title="Cañada College">Cañada</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Directory */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-xl">
              {searchTerm || selectedCampus !== "ALL" 
                ? "Search Results" 
                : "All Faculty"}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {filteredDoorcards.length} professor{filteredDoorcards.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardTitle>
          {!loading && filteredDoorcards.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Click on any professor to view their office hours and contact information
            </p>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-3">Finding professors...</p>
            </div>
          ) : filteredDoorcards.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-lg p-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No professors found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? `No professors match "${searchTerm}"`
                    : "No professors available for the selected campus"
                  }
                </p>
                <p className="text-sm text-gray-500">
                  Try adjusting your search or selecting a different campus
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDoorcards.map((doorcard) => (
                <Card
                  key={doorcard.id}
                  className="cursor-pointer hover:shadow-lg hover:border-blue-200 transition-all duration-200 border-2 hover:bg-blue-50/30"
                  onClick={() => handleDoorcardClick(doorcard)}
                >
                  <CardContent className="p-5">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">
                            {doorcard.name}
                          </h3>
                          {doorcard.doorcardName !== doorcard.name && (
                            <p className="text-sm text-gray-600 mb-2">
                              {doorcard.doorcardName}
                            </p>
                          )}
                        </div>
                        {doorcard.college && (
                          <Badge 
                            variant="outline" 
                            className="ml-2 text-xs font-medium"
                            title={COLLEGE_FULL_NAMES[doorcard.college as College]}
                          >
                            {COLLEGE_BADGE_NAMES[doorcard.college as College]}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span className="font-medium text-gray-900">
                            Office {doorcard.officeNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-gray-700">
                            {doorcard.appointmentCount > 0 
                              ? `${doorcard.appointmentCount} office hour${doorcard.appointmentCount !== 1 ? 's' : ''} available`
                              : "Office hours posted"
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-purple-600 flex-shrink-0" />
                          <span className="text-gray-700">
                            {doorcard.term} {doorcard.year}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
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

      {/* Helpful Tips */}
      {!loading && filteredDoorcards.length > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">💡 Student Tips</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Before visiting:</strong> Check if your professor requires appointments or has drop-in hours</p>
                  <p><strong>Office locations:</strong> Allow extra time to find offices, especially on your first visit</p>
                  <p><strong>Contact info:</strong> Each professor's page includes their preferred contact method</p>
                  <p><strong>Schedule changes:</strong> Office hours may change during finals week or holidays</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
