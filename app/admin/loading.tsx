import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminLoading() {
  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 animate-pulse rounded"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-20 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-10 w-28 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="doorcards">Doorcards</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Overview Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 w-4 bg-gray-200 animate-pulse rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="h-3 w-24 bg-gray-200 animate-pulse rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Campus Breakdown Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="h-6 w-40 bg-gray-200 animate-pulse rounded"></div>
              </CardTitle>
              <CardDescription>
                <div className="h-4 w-48 bg-gray-200 animate-pulse rounded"></div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="h-5 w-20 bg-gray-200 animate-pulse rounded mb-2"></div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="flex justify-between">
                          <div className="h-3 w-16 bg-gray-200 animate-pulse rounded"></div>
                          <div className="h-3 w-8 bg-gray-200 animate-pulse rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
              </CardTitle>
              <CardDescription>
                <div className="h-4 w-48 bg-gray-200 animate-pulse rounded"></div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 h-10 bg-gray-200 animate-pulse rounded"></div>
                  <div className="w-40 h-10 bg-gray-200 animate-pulse rounded"></div>
                </div>

                <div className="border rounded-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <th key={i} className="text-left p-3">
                              <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <tr key={i} className="border-b">
                            {[1, 2, 3, 4, 5].map((j) => (
                              <td key={j} className="p-3">
                                <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="doorcards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="h-6 w-40 bg-gray-200 animate-pulse rounded"></div>
              </CardTitle>
              <CardDescription>
                <div className="h-4 w-56 bg-gray-200 animate-pulse rounded"></div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 h-10 bg-gray-200 animate-pulse rounded"></div>
                  <div className="w-40 h-10 bg-gray-200 animate-pulse rounded"></div>
                </div>

                <div className="border rounded-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <th key={i} className="text-left p-3">
                              <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <tr key={i} className="border-b">
                            {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                              <td key={j} className="p-3">
                                <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="h-6 w-36 bg-gray-200 animate-pulse rounded"></div>
              </CardTitle>
              <CardDescription>
                <div className="h-4 w-64 bg-gray-200 animate-pulse rounded"></div>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p>Loading analytics dashboard...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
