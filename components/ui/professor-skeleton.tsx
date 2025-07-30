import { Card, CardContent } from "@/components/ui/card";

interface ProfessorSkeletonProps {
  count?: number;
}

export function ProfessorSkeleton({ count = 6 }: ProfessorSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(count)].map((_, i) => (
        <Card
          key={i}
          className="border-2 dark:bg-gray-700 dark:border-gray-400"
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-3/4"></div>
                </div>
                <div className="h-6 w-12 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-32"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-40"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-24"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
