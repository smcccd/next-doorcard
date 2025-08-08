"use client";

import { PublicDoorcard } from "@/types/pages/public";
import { SimpleFacultyCard } from "./simple-faculty-card";

interface SimpleFacultyGridProps {
  doorcards: PublicDoorcard[];
  loading: boolean;
  onDoorcardClick: (doorcard: PublicDoorcard) => void;
}

export function SimpleFacultyGrid({
  doorcards,
  loading,
  onDoorcardClick,
}: SimpleFacultyGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (doorcards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">No faculty found</p>
          <p className="text-sm">
            Try adjusting your search or selecting a different campus
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {doorcards.map((doorcard) => (
        <SimpleFacultyCard
          key={doorcard.id}
          doorcard={doorcard}
          onClick={onDoorcardClick}
        />
      ))}
    </div>
  );
}
