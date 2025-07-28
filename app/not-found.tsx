import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Search className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            404 - Page Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-3">
            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
              Looks like this professor's office hours are cancelled!
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm">
              Even the most organized faculty member can't be everywhere at
              once. This page seems to have taken an unscheduled break.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
            <p className="text-blue-800 dark:text-blue-200 text-sm font-medium">
              💡 Pro Tip: Check your syllabus for the correct office location!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              asChild
              variant="outline"
              className="flex items-center gap-2"
            >
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Link>
            </Button>
            <Button asChild className="flex items-center gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
