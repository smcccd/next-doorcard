"use client";

import { useEffect, useState } from "react";
import { LazyAnalyticsChart } from "@/components/analytics/LazyAnalyticsChart";
import { fetchWithTimeout, fetchPresets } from "@/lib/fetch-with-timeout";
import { LazyTestChart } from "@/components/analytics/LazyTestChart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CollegeLogo from "@/components/CollegeLogo";
import { College } from "@/types/doorcard";
import {
  Activity,
  Eye,
  FileDown,
  Share2,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

interface SystemStats {
  totalEvents: number;
  recentEvents: number;
  eventBreakdown: Record<string, number>;
}

interface DoorcardAnalytics {
  doorcardId: string;
  doorcardName: string;
  facultyName: string;
  totalViews: number;
  totalPrints: number;
  totalShares: number;
  lastViewedAt?: string;
  college: string;
}

interface AnalyticsData {
  totalViews: number;
  uniqueViews: number;
  totalPrints: number;
  totalShares: number;
  engagementScore: number;
}

interface AdminAnalyticsData {
  analytics: AnalyticsData;
  doorcards: DoorcardAnalytics[];
  systemStats: SystemStats;
}

export function AdminAnalytics() {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetchWithTimeout("/api/admin/analytics", fetchPresets.heavy);

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const analyticsData = await response.json();
      setData(analyticsData);
      setError("");
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Activity className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analytics Error</h3>
          <p className="text-red-600 mb-4">
            {error || "Failed to load analytics"}
          </p>
          <Button onClick={fetchAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { analytics, doorcards, systemStats } = data;

  return (
    <div className="space-y-6">
      {/* Test Chart */}
      <LazyTestChart />

      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Analytics</h2>
          <p className="text-gray-600">
            System-wide usage statistics and insights
          </p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline" disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStats.totalEvents.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemStats.recentEvents} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.uniqueViews.toLocaleString()} unique views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <FileDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalPrints.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemStats.eventBreakdown.PRINT_PREVIEW || 0} previews,{" "}
              {systemStats.eventBreakdown.PRINT_DOWNLOAD || 0} downloads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shares</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalShares.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemStats.eventBreakdown.SHARE || 0} share events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Chart */}
      <LazyAnalyticsChart
        data={analytics}
        doorcardAnalytics={doorcards}
        title="Platform Analytics Dashboard"
        showComparison={true}
      />

      {/* Top Performing Doorcards Table */}
      {doorcards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Doorcards
            </CardTitle>
            <CardDescription>
              Doorcards with the highest engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">
                      Doorcard
                    </th>
                    <th className="text-left p-3 text-sm font-medium">
                      Faculty
                    </th>
                    <th className="text-left p-3 text-sm font-medium">
                      Campus
                    </th>
                    <th className="text-left p-3 text-sm font-medium">Views</th>
                    <th className="text-left p-3 text-sm font-medium">
                      Downloads
                    </th>
                    <th className="text-left p-3 text-sm font-medium">
                      Shares
                    </th>
                    <th className="text-left p-3 text-sm font-medium">
                      Last Activity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {doorcards.slice(0, 15).map((doorcard) => (
                    <tr key={doorcard.doorcardId} className="border-b">
                      <td className="p-3">
                        <div className="font-medium">
                          {doorcard.doorcardName}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">
                          {doorcard.facultyName}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1.5 w-fit"
                        >
                          <CollegeLogo
                            college={doorcard.college as College}
                            height={14}
                            className="flex-shrink-0"
                          />
                          {doorcard.college}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">
                            {doorcard.totalViews}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <FileDown className="h-4 w-4 text-green-600" />
                          <span className="font-medium">
                            {doorcard.totalPrints}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Share2 className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium">
                            {doorcard.totalShares}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-500">
                          {doorcard.lastViewedAt
                            ? new Date(
                                doorcard.lastViewedAt
                              ).toLocaleDateString()
                            : "Never"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {doorcards.length > 15 && (
              <div className="p-3 text-center text-sm text-gray-500 border-t">
                Showing top 15 of {doorcards.length} active doorcards
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Event Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Event Breakdown
          </CardTitle>
          <CardDescription>
            Distribution of all tracked events on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(systemStats.eventBreakdown).map(
              ([eventType, count]) => (
                <div
                  key={eventType}
                  className="text-center p-4 border rounded-lg"
                >
                  <div className="text-2xl font-bold text-indigo-600">
                    {count}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    {eventType.toLowerCase().replace("_", " ")}
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
