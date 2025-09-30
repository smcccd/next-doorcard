import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-8">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        {/* ProfileBanner Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
            </div>
          </div>
        </div>

        {/* Header Section Skeleton */}
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
              </div>
            </div>
            <div className="h-10 w-36 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
          </div>
        </header>

        {/* Stats Cards Skeleton */}
        <section aria-labelledby="stats-heading">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                    <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                  </div>
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Current Term Doorcards Skeleton */}
        <section className="space-y-4">
          <div className="h-6 w-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      <div className="flex items-center gap-4">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Upcoming Terms Skeleton */}
        <section className="space-y-4">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      <div className="flex items-center gap-4">
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Past Terms Skeleton */}
        <section className="space-y-4">
          <div className="h-6 w-44 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
          <div className="space-y-4">
            {[1].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      <div className="flex items-center gap-4">
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
