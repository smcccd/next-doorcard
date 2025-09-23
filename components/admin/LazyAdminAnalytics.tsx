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
import { Activity } from "lucide-react";

// Dynamic import with loading state
const AdminAnalytics = dynamic(
  () =>
    import("./AdminAnalytics").then((mod) => ({ default: mod.AdminAnalytics })),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Platform Analytics
          </CardTitle>
          <CardDescription>
            System-wide usage statistics and insights
          </CardDescription>
        </CardHeader>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading analytics dashboard...</p>
        </CardContent>
      </Card>
    ),
  }
);

export function LazyAdminAnalytics() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Platform Analytics
            </CardTitle>
            <CardDescription>
              System-wide usage statistics and insights
            </CardDescription>
          </CardHeader>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading analytics dashboard...</p>
          </CardContent>
        </Card>
      }
    >
      <AdminAnalytics />
    </Suspense>
  );
}
