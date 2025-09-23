"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

// Types for props
interface AnalyticsData {
  totalViews: number;
  uniqueViews: number;
  totalPrints: number;
  totalShares: number;
  engagementScore: number;
  recentActivity?: {
    date: string;
    views: number;
    prints: number;
    shares: number;
  }[];
}

interface DoorcardAnalytics {
  doorcardId: string;
  doorcardName: string;
  totalViews: number;
  totalPrints: number;
  totalShares: number;
  lastViewedAt?: string;
}

interface AnalyticsChartProps {
  data: AnalyticsData;
  doorcardAnalytics?: DoorcardAnalytics[];
  title?: string;
  showComparison?: boolean;
}

// Dynamic import with loading state
const AnalyticsChart = dynamic(
  () =>
    import("./AnalyticsChart").then((mod) => ({ default: mod.AnalyticsChart })),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analytics Overview
          </CardTitle>
          <CardDescription>Analytics and engagement metrics</CardDescription>
        </CardHeader>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading analytics charts...</p>
        </CardContent>
      </Card>
    ),
  }
);

export function LazyAnalyticsChart(props: AnalyticsChartProps) {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {props.title || "Analytics Overview"}
            </CardTitle>
            <CardDescription>Analytics and engagement metrics</CardDescription>
          </CardHeader>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading analytics charts...</p>
          </CardContent>
        </Card>
      }
    >
      <AnalyticsChart {...props} />
    </Suspense>
  );
}
