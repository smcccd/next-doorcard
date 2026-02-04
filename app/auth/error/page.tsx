"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  AlertTriangle,
  Info as InfoIcon,
  ArrowLeft,
} from "lucide-react";
import { getAuthErrorInfo, getSeverityColorClasses } from "@/lib/auth-errors";
import { ITSupportContact } from "@/components/shared/ITSupportContact";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Use centralized error mapping
  const errorInfo = getAuthErrorInfo(error);
  const colors = getSeverityColorClasses(errorInfo.severity);

  // Select icon based on severity
  const ErrorIcon =
    errorInfo.severity === "critical"
      ? AlertCircle
      : errorInfo.severity === "warning"
        ? AlertTriangle
        : InfoIcon;

  return (
    <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full">
        <Card>
          <CardHeader className="text-center">
            <div
              className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${colors.bg} mb-4`}
            >
              <ErrorIcon className={`h-6 w-6 ${colors.icon}`} />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {errorInfo.title}
            </CardTitle>
            <CardDescription className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {errorInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Action steps */}
            {errorInfo.steps && errorInfo.steps.length > 0 && (
              <div
                className={`${colors.bg} border ${colors.border} rounded-lg p-4`}
              >
                <div className={`text-sm ${colors.text}`}>
                  <p className="font-semibold mb-2">What to do:</p>
                  <ol className="ml-4 list-decimal space-y-2">
                    {errorInfo.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {/* IT Support contact */}
            {errorInfo.showITSupport && <ITSupportContact />}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <Button asChild variant="outline" className="flex-1">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </Button>

              {errorInfo.severity !== "critical" && (
                <Button asChild className="flex-1">
                  <Link href="/login">{errorInfo.action}</Link>
                </Button>
              )}
            </div>

            {/* Debug information for development */}
            {process.env.NODE_ENV === "development" &&
              errorInfo.technicalDetails && (
                <details className="mt-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <summary className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                    🔧 Technical Details (Dev Only)
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Error Code:
                      </p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-mono bg-white dark:bg-gray-900 p-2 rounded mt-1">
                        {error || "No error code"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Details:
                      </p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-mono bg-white dark:bg-gray-900 p-2 rounded mt-1">
                        {errorInfo.technicalDetails}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Severity:
                      </p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-mono bg-white dark:bg-gray-900 p-2 rounded mt-1">
                        {errorInfo.severity}
                      </p>
                    </div>
                  </div>
                </details>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
