"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, FileDown, Share2, TrendingUp } from "lucide-react";

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

const COLORS = {
  views: "#3b82f6",
  prints: "#10b981",
  shares: "#f59e0b",
  primary: "#6366f1",
};

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export function AnalyticsChart({
  data,
  doorcardAnalytics = [],
  title = "Analytics Overview",
  showComparison = false,
}: AnalyticsChartProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prepare data for charts
  const overviewData = [
    { name: "Views", value: data.totalViews, color: COLORS.views },
    { name: "Unique Views", value: data.uniqueViews, color: COLORS.primary },
    { name: "Prints", value: data.totalPrints, color: COLORS.prints },
    { name: "Shares", value: data.totalShares, color: COLORS.shares },
  ];

  const pieData = [
    { name: "Views", value: data.totalViews },
    { name: "Prints", value: data.totalPrints },
    { name: "Shares", value: data.totalShares },
  ].filter((item) => item.value > 0);

  const topDoorcards = doorcardAnalytics
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 10)
    .map((card) => ({
      name: card.doorcardName || "Untitled",
      views: card.totalViews,
      prints: card.totalPrints,
      shares: card.totalShares,
      engagement: card.totalViews + card.totalPrints * 2 + card.totalShares * 3,
    }));

  if (!mounted) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading analytics charts...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>Analytics and engagement metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Activity</TabsTrigger>
            <TabsTrigger value="doorcards">Top Doorcards</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold">
                      {data.totalViews.toLocaleString()}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-600" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Unique Views</p>
                    <p className="text-2xl font-bold">
                      {data.uniqueViews.toLocaleString()}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-indigo-600" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Downloads</p>
                    <p className="text-2xl font-bold">
                      {data.totalPrints.toLocaleString()}
                    </p>
                  </div>
                  <FileDown className="h-8 w-8 text-green-600" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Shares</p>
                    <p className="text-2xl font-bold">
                      {data.totalShares.toLocaleString()}
                    </p>
                  </div>
                  <Share2 className="h-8 w-8 text-yellow-600" />
                </CardContent>
              </Card>
            </div>

            {/* Engagement Score */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Engagement Score</h3>
                    <p className="text-3xl font-bold text-indigo-600">
                      {data.engagementScore}/100
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Based on views, downloads, and sharing activity
                    </p>
                  </div>
                  <div className="w-24 h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { value: data.engagementScore },
                            { value: 100 - data.engagementScore },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={45}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                        >
                          <Cell fill={COLORS.primary} />
                          <Cell fill="#e5e7eb" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Distribution */}
            {pieData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Activity Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${((percent || 0) * 100).toFixed(0)}%`
                          }
                        >
                          {pieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Activity Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={overviewData.slice(0, 3)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-6 mt-6">
            {data.recentActivity && data.recentActivity.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Recent Activity Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.recentActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString()
                        }
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(value) =>
                          new Date(value).toLocaleDateString()
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke={COLORS.views}
                        strokeWidth={2}
                        name="Views"
                      />
                      <Line
                        type="monotone"
                        dataKey="prints"
                        stroke={COLORS.prints}
                        strokeWidth={2}
                        name="Prints"
                      />
                      <Line
                        type="monotone"
                        dataKey="shares"
                        stroke={COLORS.shares}
                        strokeWidth={2}
                        name="Shares"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Trend Data Yet
                  </h3>
                  <p className="text-gray-600">
                    Activity trends will appear here once there's more
                    engagement data.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="doorcards" className="space-y-6 mt-6">
            {topDoorcards.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Top Performing Doorcards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={topDoorcards} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) =>
                          value.length > 15
                            ? `${value.substring(0, 15)}...`
                            : value
                        }
                      />
                      <Tooltip />
                      <Bar dataKey="views" fill={COLORS.views} name="Views" />
                      <Bar
                        dataKey="prints"
                        fill={COLORS.prints}
                        name="Prints"
                      />
                      <Bar
                        dataKey="shares"
                        fill={COLORS.shares}
                        name="Shares"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Eye className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Doorcard Data
                  </h3>
                  <p className="text-gray-600">
                    Individual doorcard analytics will appear here once there's
                    activity.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
