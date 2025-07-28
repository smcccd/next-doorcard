"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Eye,
  Filter,
  Search,
  Users,
} from "lucide-react";

interface Doorcard {
  id: string;
  name: string;
  doorcardName: string;
  officeNumber: string;
  term: string;
  year: string;
  college: string;
  isActive: boolean;
  isPublic: boolean;
  slug: string;
  user: {
    name: string;
    email: string;
    username?: string;
    college: string;
  };
  _count: {
    appointments: number;
  };
}

interface DoorcardOversightProps {
  doorcards: Doorcard[];
  onEditDoorcard: (doorcard: Doorcard) => void;
  onExportDoorcards: () => void;
  onBulkAction: (doorcardIds: string[], action: string) => void;
}

const ITEMS_PER_PAGE = 12;
const COLLEGES = ["SKYLINE", "CSM", "CANADA"];
const STATUSES = ["active", "inactive", "public", "private"];

export default function DoorcardOversight({
  doorcards,
  onEditDoorcard,
  onExportDoorcards,
  onBulkAction,
}: DoorcardOversightProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCollege, setFilterCollege] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedDoorcards, setSelectedDoorcards] = useState<string[]>([]);

  // Filter and search logic
  const filteredDoorcards = useMemo(() => {
    return doorcards.filter((doorcard) => {
      const matchesSearch =
        doorcard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doorcard.doorcardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doorcard.officeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doorcard.user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCollege =
        filterCollege === "all" || doorcard.college === filterCollege;

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && doorcard.isActive) ||
        (filterStatus === "inactive" && !doorcard.isActive) ||
        (filterStatus === "public" && doorcard.isPublic) ||
        (filterStatus === "private" && !doorcard.isPublic);

      return matchesSearch && matchesCollege && matchesStatus;
    });
  }, [doorcards, searchTerm, filterCollege, filterStatus]);

  // Pagination logic
  const totalPages = Math.ceil(filteredDoorcards.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedDoorcards = filteredDoorcards.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  const handleFilterChange = (filterFn: () => void) => {
    filterFn();
    setCurrentPage(1);
  };

  const handleSelectDoorcard = (doorcardId: string, checked: boolean) => {
    if (checked) {
      setSelectedDoorcards([...selectedDoorcards, doorcardId]);
    } else {
      setSelectedDoorcards(selectedDoorcards.filter((id) => id !== doorcardId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDoorcards(paginatedDoorcards.map((d) => d.id));
    } else {
      setSelectedDoorcards([]);
    }
  };

  const isAllSelected =
    paginatedDoorcards.length > 0 &&
    paginatedDoorcards.every((d) => selectedDoorcards.includes(d.id));

  const handleViewDoorcard = (doorcard: Doorcard) => {
    window.open(`/doorcard/${doorcard.id}/view?auth=true`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          <div>
            <h2 className="text-lg font-semibold">Doorcard Oversight</h2>
            <p className="text-sm text-gray-600">
              {filteredDoorcards.length} of {doorcards.length} doorcards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedDoorcards.length > 0 && (
            <Badge variant="secondary" className="px-3 py-1">
              {selectedDoorcards.length} selected
            </Badge>
          )}
          <Button onClick={onExportDoorcards} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Name, email, office..."
                  value={searchTerm}
                  onChange={(e) =>
                    handleFilterChange(() => setSearchTerm(e.target.value))
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>College</Label>
              <Select
                value={filterCollege}
                onValueChange={(value) =>
                  handleFilterChange(() => setFilterCollege(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  {COLLEGES.map((college) => (
                    <SelectItem key={college} value={college}>
                      {college === "CSM" ? "College of San Mateo" : 
                       college === "CANADA" ? "Cañada College" :
                       "Skyline College"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filterStatus}
                onValueChange={(value) =>
                  handleFilterChange(() => setFilterStatus(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterCollege("all");
                    setFilterStatus("all");
                    setCurrentPage(1);
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Doorcard List */}
      <Card>
        <CardContent className="p-0">
          {paginatedDoorcards.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <Users className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No doorcards found</h3>
              <p className="text-gray-500">
                Try adjusting your search terms or filters
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="border-b bg-gray-50 px-6 py-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-4"
                  />
                  <div className="text-sm font-medium text-gray-700">
                    Select all on this page
                  </div>
                </div>
              </div>

              {/* Doorcard Items */}
              <div className="divide-y">
                {paginatedDoorcards.map((doorcard) => (
                  <div
                    key={doorcard.id}
                    className={`p-6 hover:bg-gray-50 transition-colors ${
                      selectedDoorcards.includes(doorcard.id)
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedDoorcards.includes(doorcard.id)}
                          onChange={(e) =>
                            handleSelectDoorcard(doorcard.id, e.target.checked)
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {doorcard.doorcardName}
                            </h3>
                            <div className="flex gap-1">
                              <Badge
                                variant={doorcard.isActive ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {doorcard.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Badge
                                variant={doorcard.isPublic ? "outline" : "secondary"}
                                className="text-xs"
                              >
                                {doorcard.isPublic ? "Public" : "Private"}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">{doorcard.name}</span> • 
                            Office {doorcard.officeNumber} • 
                            {doorcard.college} • 
                            {doorcard.term} {doorcard.year}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {doorcard.user.email} • {doorcard._count.appointments} appointments
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditDoorcard(doorcard)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDoorcard(doorcard)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredDoorcards.length)} of{" "}
            {filteredDoorcards.length} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}