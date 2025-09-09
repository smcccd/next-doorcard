"use client";

import { PublicDoorcard } from "@/types/pages/public";
import { DoorcardCard } from "./DoorcardCard";

interface DoorcardGridProps {
  doorcards: PublicDoorcard[];
}

export function DoorcardGrid({ doorcards }: DoorcardGridProps) {
  if (doorcards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
          <p className="text-gray-600 text-lg font-medium">
            No faculty doorcards found
          </p>
          <p className="text-gray-500 mt-2">
            Try adjusting your search criteria or filters to find more results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {doorcards.map((doorcard) => (
        <DoorcardCard key={doorcard.id} doorcard={doorcard} />
      ))}
    </div>
  );
}
