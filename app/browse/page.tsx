import { Suspense } from "react";
import { Metadata } from "next";
import { BrowseDoorcards } from "./components/BrowseDoorcards";
import { SearchSkeleton } from "./components/SearchSkeleton";

export const metadata: Metadata = {
  title: "Browse Faculty Doorcards",
  description:
    "Search and browse faculty office hours and schedules across all campuses",
  openGraph: {
    title: "Browse Faculty Doorcards",
    description:
      "Search and browse faculty office hours and schedules across all campuses",
  },
};

export default function BrowsePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Browse Faculty Doorcards
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Find faculty office hours, contact information, and schedules
              across all campuses
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<SearchSkeleton />}>
          <BrowseDoorcards />
        </Suspense>
      </div>
    </div>
  );
}
