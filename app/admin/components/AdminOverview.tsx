"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Archive,
  Users,
  FileText,
  CheckCircle,
  Plus,
  Download,
  TrendingUp,
} from "lucide-react";

interface Term {
  id: string;
  name: string;
  year: string;
  season: string;
  isActive: boolean;
  isArchived: boolean;
  isUpcoming: boolean;
  _count: {
    doorcards: number;
  };
}

interface Doorcard {
  id: string;
  name: string;
  isActive: boolean;
  user: {
    email: string;
  };
}

interface AdminOverviewProps {
  terms: Term[];
  doorcards: Doorcard[];
  onCreateTerm: () => void;
  onExportDoorcards: () => void;
}

export default function AdminOverview({
  terms,
  doorcards,
  onCreateTerm,
  onExportDoorcards,
}: AdminOverviewProps) {
  const activeTerm = terms.find((t) => t.isActive);
  const archivedTerms = terms.filter((t) => t.isArchived);
  const upcomingTerms = terms.filter((t) => t.isUpcoming);
  const activeDoorcards = doorcards.filter((d) => d.isActive);
  const uniqueUsers = new Set(doorcards.map((d) => d.user.email)).size;

  const stats = [
    {
      title: "Active Term",
      value: activeTerm ? activeTerm.name : "None",
      subtitle: activeTerm
        ? `${activeTerm._count.doorcards} doorcards`
        : "No active term",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Terms",
      value: terms.length.toString(),
      subtitle: `${archivedTerms.length} archived, ${upcomingTerms.length} upcoming`,
      icon: Archive,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Doorcards",
      value: doorcards.length.toString(),
      subtitle: `${activeDoorcards.length} active`,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Active Faculty",
      value: uniqueUsers.toString(),
      subtitle: "Unique faculty members",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">
            Manage terms and oversee faculty doorcards
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onExportDoorcards} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={onCreateTerm} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Term
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500">{stat.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Term Status */}
      {activeTerm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Current Active Term
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{activeTerm.name}</h3>
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {activeTerm._count.doorcards} faculty doorcards in this term
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <TrendingUp className="h-4 w-4" />
                Term Management
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={onCreateTerm}
            >
              <Plus className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">Create New Term</div>
                <div className="text-xs text-gray-500">
                  Add a new academic term
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={onExportDoorcards}
            >
              <Download className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <div className="font-medium">Export Doorcards</div>
                <div className="text-xs text-gray-500">Download CSV report</div>
              </div>
            </Button>

            <div className="p-4 border border-dashed border-gray-300 rounded-lg flex flex-col items-start gap-2 text-gray-500">
              <Archive className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium text-gray-700">
                  Archive Management
                </div>
                <div className="text-xs">Automated term archiving</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
