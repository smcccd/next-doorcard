"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamic import with loading state
const TestChart = dynamic(
  () => import("./TestChart").then((mod) => ({ default: mod.TestChart })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 p-4 border rounded flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        <span className="ml-2 text-gray-500">Loading test chart...</span>
      </div>
    ),
  }
);

export function LazyTestChart() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-64 p-4 border rounded flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-gray-500">Loading test chart...</span>
        </div>
      }
    >
      <TestChart />
    </Suspense>
  );
}
