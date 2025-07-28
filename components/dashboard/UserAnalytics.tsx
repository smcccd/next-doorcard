"use client";

import { useEffect, useState } from "react";
import { AnalyticsChart } from "@/components/analytics/AnalyticsChart";
import { TestChart } from "@/components/analytics/TestChart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Eye,
  FileDown,
  Share2,
  RefreshCw,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

interface UserAnalyticsData {
  totalDoorcards: number;
  activeDoors: number;
  totalDrafts: number;
  totalViews: number;
  uniqueViews: number;
  avgViewsPerCard: number;
  recentPrints: number;
  totalShares: number;
  engagementScore: number;
}

interface DoorcardMetrics {
  doorcardId: string;
  doorcardName: string;
  totalViews: number;
  totalPrints: number;
  totalShares: number;
  lastViewedAt?: string;
}

export function UserAnalytics() {
  const [data, setData] = useState<UserAnalyticsData | null>(null);
  const [doorcardMetrics, setDoorcardMetrics] = useState<DoorcardMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/analytics/metrics");

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const analyticsData = await response.json();
      setData(analyticsData);

      // For now, we don't have per-doorcard metrics in the user endpoint
      // You could enhance this by creating a separate endpoint
      setDoorcardMetrics([]);
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
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading your analytics...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
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

  // Transform data for the AnalyticsChart component
  const chartData = {
    totalViews: data.totalViews,
    uniqueViews: data.uniqueViews,
    totalPrints: data.recentPrints, // Using recent prints as total prints
    totalShares: data.totalShares,
    engagementScore: data.engagementScore,
  };

  return (
    <div className="space-y-6">
      {/* Test Chart */}
      <TestChart />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data.totalViews}
            </div>
            <div className="text-sm text-gray-600">Total Views</div>
            <div className="text-xs text-gray-500">
              {data.uniqueViews} unique
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {data.recentPrints}
            </div>
            <div className="text-sm text-gray-600">Downloads</div>
            <div className="text-xs text-gray-500">Last 30 days</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {data.totalShares}
            </div>
            <div className="text-sm text-gray-600">Shares</div>
            <div className="text-xs text-gray-500">All time</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {data.engagementScore}
            </div>
            <div className="text-sm text-gray-600">Engagement</div>
            <div className="text-xs text-gray-500">Out of 100</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Chart */}
      <AnalyticsChart
        data={chartData}
        doorcardAnalytics={doorcardMetrics}
        title="Your Doorcard Analytics"
      />

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Insights
          </CardTitle>
          <CardDescription>
            Tips to improve your doorcard engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.avgViewsPerCard < 5 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">
                      Increase Visibility
                    </h4>
                    <p className="text-sm text-blue-700">
                      Your doorcards average {data.avgViewsPerCard} views each.
                      Make sure they're public and information is complete.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.totalShares === 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Share2 className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">
                      Enable Sharing
                    </h4>
                    <p className="text-sm text-yellow-700">
                      Your doorcards haven't been shared yet. Encourage students
                      to share your office hours.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.recentPrints === 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileDown className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">
                      Print-Ready Format
                    </h4>
                    <p className="text-sm text-green-700">
                      No downloads yet. Make sure your doorcard information is
                      print-friendly for students who want offline access.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.totalDrafts > 0 && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900">
                      Publish Draft Doorcards
                    </h4>
                    <p className="text-sm text-purple-700">
                      You have {data.totalDrafts} draft doorcard
                      {data.totalDrafts > 1 ? "s" : ""}. Complete and publish
                      them to increase student access.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.engagementScore >= 70 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">
                      Great Engagement!
                    </h4>
                    <p className="text-sm text-green-700">
                      Your doorcards have strong engagement with a score of{" "}
                      {data.engagementScore}/100. Keep up the excellent work!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold">
                  {data.activeDoors}/{data.totalDoorcards}
                </div>
                <div className="text-sm text-gray-600">Active Doorcards</div>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {data.avgViewsPerCard}
                </div>
                <div className="text-sm text-gray-600">Avg Views per Card</div>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {data.uniqueViews > 0
                    ? Math.round((data.uniqueViews / data.totalViews) * 100)
                    : 0}
                  %
                </div>
                <div className="text-sm text-gray-600">Unique View Rate</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
