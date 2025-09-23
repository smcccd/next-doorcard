import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Hero Section Skeleton */}
      <div className="mb-8 text-center">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mx-auto mb-2"></div>
        <div className="h-4 w-64 bg-gray-200 animate-pulse rounded mx-auto"></div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="mb-8">
        <div className="h-6 w-32 bg-gray-200 animate-pulse rounded mb-4"></div>
        <div className="flex flex-wrap gap-4">
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-10 w-28 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-10 w-24 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Doorcards Skeleton */}
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
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="h-5 w-32 bg-gray-200 animate-pulse rounded mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Draft Doorcards Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="h-6 w-28 bg-gray-200 animate-pulse rounded"></div>
            </CardTitle>
            <CardDescription>
              <div className="h-4 w-40 bg-gray-200 animate-pulse rounded"></div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="h-5 w-28 bg-gray-200 animate-pulse rounded mb-2"></div>
                    <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Skeleton */}
      <div className="mt-8">
        <div className="h-6 w-24 bg-gray-200 animate-pulse rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-4 w-4 bg-gray-200 animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
