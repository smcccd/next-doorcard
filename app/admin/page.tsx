"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Users, Calendar, MapPin, Activity, Search, Download, RefreshCw, CheckCircle, XCircle, Eye, Clock, Building, Mail, User, Globe } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDoorcards: number;
  activeDoorcards: number;
  totalAppointments: number;
  campusBreakdown: {
    [key: string]: {
      users: number;
      doorcards: number;
      appointments: number;
    };
  };
  recentActivity: {
    newUsers: number;
    newDoorcards: number;
    newAppointments: number;
  };
}

interface User {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string;
  role: string;
  college: string | null;
  createdAt: string;
  doorcardCount: number;
  appointmentCount: number;
  lastActive: string | null;
}

interface Doorcard {
  id: string;
  name: string;
  doorcardName: string;
  term: string;
  year: number;
  college: string;
  isActive: boolean;
  isPublic: boolean;
  officeNumber: string;
  appointmentCount: number;
  createdAt: string;
  user: {
    email: string;
    name: string | null;
  };
}

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string;
  role: string;
  college: string | null;
  title: string | null;
  pronouns: string | null;
  website: string | null;
  displayFormat: string | null;
  createdAt: string;
  updatedAt: string;
  totalDoorcards: number;
  activeDoorcards: number;
  totalAppointments: number;
  doorcards: {
    id: string;
    name: string;
    doorcardName: string;
    term: string;
    year: number;
    college: string;
    isActive: boolean;
    isPublic: boolean;
    officeNumber: string;
    appointmentCount: number;
    createdAt: string;
    updatedAt: string;
    appointments: {
      id: string;
      name: string;
      startTime: string;
      endTime: string;
      dayOfWeek: string;
      category: string;
      location: string | null;
    }[];
  }[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [doorcards, setDoorcards] = useState<Doorcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [campusFilter, setCampusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, doorcardsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/doorcards"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (doorcardsRes.ok) {
        const doorcardsData = await doorcardsRes.json();
        setDoorcards(doorcardsData);
      }

      if (!statsRes.ok && !usersRes.ok && !doorcardsRes.ok) {
        setError("Failed to load admin data");
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      setLoadingUserDetails(true);
      const response = await fetch(`/api/admin/users/${userId}`);
      
      if (response.ok) {
        const userData = await response.json();
        setSelectedUser(userData);
        setUserDetailsOpen(true);
      } else {
        console.error("Failed to fetch user details");
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const formatUserDisplayName = (user: UserDetail) => {
    if (user.firstName && user.lastName) {
      if (user.title && user.title !== "none") {
        return `${user.title} ${user.firstName} ${user.lastName}`;
      }
      return `${user.firstName} ${user.lastName}`;
    }
    return user.name || user.username;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDayName = (dayOfWeek: string) => {
    const days = {
      MONDAY: 'Monday',
      TUESDAY: 'Tuesday', 
      WEDNESDAY: 'Wednesday',
      THURSDAY: 'Thursday',
      FRIDAY: 'Friday',
      SATURDAY: 'Saturday',
      SUNDAY: 'Sunday'
    };
    return days[dayOfWeek as keyof typeof days] || dayOfWeek;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      OFFICE_HOURS: 'bg-blue-100 text-blue-800',
      CLASS: 'bg-green-100 text-green-800',
      MEETING: 'bg-purple-100 text-purple-800',
      RESEARCH: 'bg-orange-100 text-orange-800',
      OTHER: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.OTHER;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCampus = campusFilter === "all" || user.college === campusFilter;
    
    return matchesSearch && matchesCampus;
  });

  const filteredDoorcards = doorcards.filter(doorcard => {
    const matchesSearch = !searchQuery ||
      doorcard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doorcard.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCampus = campusFilter === "all" || doorcard.college === campusFilter;
    
    return matchesSearch && matchesCampus;
  });

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-800">Admin Dashboard Error</h2>
          </div>
          <p className="text-red-600 mt-2">{error}</p>
          <Button onClick={fetchAdminData} className="mt-4" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600">Faculty Doorcard Platform Administration</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchAdminData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="doorcards">Doorcards</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeUsers} active users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Doorcards</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDoorcards.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeDoorcards} currently active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalAppointments.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    All scheduled appointments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.recentActivity.newUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    New users this week
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Campus Breakdown */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Campus Distribution</CardTitle>
                <CardDescription>Usage breakdown by campus</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(stats.campusBreakdown).map(([campus, data]) => (
                    <div key={campus} className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">{campus}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Users:</span>
                          <span className="font-medium">{data.users}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Doorcards:</span>
                          <span className="font-medium">{data.doorcards}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Appointments:</span>
                          <span className="font-medium">{data.appointments}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Search and manage faculty users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search Users</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by email, name, or username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="campus-filter">Campus</Label>
                  <Select value={campusFilter} onValueChange={setCampusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Campuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Campuses</SelectItem>
                      <SelectItem value="SKYLINE">Skyline</SelectItem>
                      <SelectItem value="CSM">CSM</SelectItem>
                      <SelectItem value="CANADA">Cañada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Users Table */}
              <div className="border rounded-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">User</th>
                        <th className="text-left p-3 text-sm font-medium">Campus</th>
                        <th className="text-left p-3 text-sm font-medium">Activity</th>
                        <th className="text-left p-3 text-sm font-medium">Status</th>
                        <th className="text-left p-3 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.slice(0, 20).map((user) => (
                        <tr key={user.id} className="border-b">
                          <td className="p-3">
                            <div>
                              <div className="font-medium">
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}` 
                                  : user.name || user.username}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            {user.college ? (
                              <Badge variant="outline">{user.college}</Badge>
                            ) : (
                              <span className="text-gray-400">Not set</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="text-sm">
                              <div>{user.doorcardCount} doorcards</div>
                              <div className="text-gray-500">{user.appointmentCount} appointments</div>
                            </div>
                          </td>
                          <td className="p-3">
                            {user.doorcardCount > 0 ? (
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => fetchUserDetails(user.id)}
                              disabled={loadingUserDetails}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {loadingUserDetails ? "Loading..." : "View Details"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length > 20 && (
                  <div className="p-3 text-center text-sm text-gray-500 border-t">
                    Showing first 20 of {filteredUsers.length} users
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="doorcards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Doorcard Management</CardTitle>
              <CardDescription>Monitor and manage faculty doorcards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Label htmlFor="doorcard-search">Search Doorcards</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="doorcard-search"
                      placeholder="Search by name or faculty..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="doorcard-campus-filter">Campus</Label>
                  <Select value={campusFilter} onValueChange={setCampusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Campuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Campuses</SelectItem>
                      <SelectItem value="SKYLINE">Skyline</SelectItem>
                      <SelectItem value="CSM">CSM</SelectItem>
                      <SelectItem value="CANADA">Cañada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Doorcards Table */}
              <div className="border rounded-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Doorcard</th>
                        <th className="text-left p-3 text-sm font-medium">Faculty</th>
                        <th className="text-left p-3 text-sm font-medium">Term</th>
                        <th className="text-left p-3 text-sm font-medium">Campus</th>
                        <th className="text-left p-3 text-sm font-medium">Status</th>
                        <th className="text-left p-3 text-sm font-medium">Activity</th>
                        <th className="text-left p-3 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDoorcards.slice(0, 20).map((doorcard) => (
                        <tr key={doorcard.id} className="border-b">
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{doorcard.doorcardName}</div>
                              <div className="text-sm text-gray-500">Office: {doorcard.officeNumber}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{doorcard.user.name || "Unknown"}</div>
                              <div className="text-sm text-gray-500">{doorcard.user.email}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">
                              {doorcard.term} {doorcard.year}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">{doorcard.college}</Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {doorcard.isActive ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-gray-400" />
                              )}
                              <span className="text-sm">
                                {doorcard.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm">
                              {doorcard.appointmentCount} appointments
                            </div>
                          </td>
                          <td className="p-3">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredDoorcards.length > 20 && (
                  <div className="p-3 text-center text-sm text-gray-500 border-t">
                    Showing first 20 of {filteredDoorcards.length} doorcards
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Analytics</CardTitle>
              <CardDescription>Usage patterns and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="text-gray-600">
                  Detailed analytics and reporting features will be available in the next release.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Modal */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* User Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Display Name</Label>
                      <p className="text-sm">{formatUserDisplayName(selectedUser)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Email</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <p className="text-sm">{selectedUser.email}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Username</Label>
                      <p className="text-sm">{selectedUser.username}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Role</Label>
                      <Badge variant="outline">{selectedUser.role}</Badge>
                    </div>
                    {selectedUser.college && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Campus</Label>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <Badge variant="outline">{selectedUser.college}</Badge>
                        </div>
                      </div>
                    )}
                    {selectedUser.pronouns && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Pronouns</Label>
                        <p className="text-sm">{selectedUser.pronouns}</p>
                      </div>
                    )}
                    {selectedUser.website && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Website</Label>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <a 
                            href={selectedUser.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {selectedUser.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Total Doorcards</Label>
                        <p className="text-2xl font-bold text-blue-600">{selectedUser.totalDoorcards}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Active Doorcards</Label>
                        <p className="text-2xl font-bold text-green-600">{selectedUser.activeDoorcards}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Total Appointments</Label>
                        <p className="text-2xl font-bold text-purple-600">{selectedUser.totalAppointments}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Account Created</Label>
                        <p className="text-sm">{formatDate(selectedUser.createdAt)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                        <p className="text-sm">{formatDate(selectedUser.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Doorcards */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Doorcards ({selectedUser.doorcards.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedUser.doorcards.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No doorcards found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedUser.doorcards.map((doorcard) => (
                        <Card key={doorcard.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="font-semibold">{doorcard.doorcardName}</h4>
                                <p className="text-sm text-gray-600">{doorcard.name}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline">
                                    {doorcard.term} {doorcard.year}
                                  </Badge>
                                  <Badge variant="outline">{doorcard.college}</Badge>
                                  {doorcard.isActive ? (
                                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                                  ) : (
                                    <Badge variant="secondary">Inactive</Badge>
                                  )}
                                  {doorcard.isPublic && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                      Public
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                <p>Office: {doorcard.officeNumber || "Not set"}</p>
                                <p>{doorcard.appointmentCount} appointments</p>
                                <p>Created: {formatDate(doorcard.createdAt)}</p>
                              </div>
                            </div>

                            {/* Appointments */}
                            {doorcard.appointments.length > 0 && (
                              <div className="border-t pt-4">
                                <h5 className="font-medium mb-3 flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  Schedule ({doorcard.appointments.length} appointments)
                                </h5>
                                <div className="grid gap-2">
                                  {doorcard.appointments.map((appointment) => (
                                    <div 
                                      key={appointment.id}
                                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="text-sm font-medium">
                                          {getDayName(appointment.dayOfWeek)}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                                        </div>
                                        <div className="text-sm font-medium">
                                          {appointment.name}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge 
                                          className={getCategoryColor(appointment.category)}
                                          variant="secondary"
                                        >
                                          {appointment.category.replace('_', ' ')}
                                        </Badge>
                                        {appointment.location && (
                                          <div className="flex items-center gap-1 text-sm text-gray-500">
                                            <MapPin className="h-3 w-3" />
                                            {appointment.location}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}