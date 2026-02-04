"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { getAuthErrorInfo, getSeverityColorClasses } from "@/lib/auth-errors";
import { ITSupportContact } from "@/components/shared/ITSupportContact";
import { AlertCircle, AlertTriangle, Info as InfoIcon } from "lucide-react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Read error from URL on mount
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setUrlError(errorParam);
      logger.warn("Login page loaded with error", { error: errorParam });
    }
  }, [searchParams]);

  const handleOneLoginSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      await signIn("onelogin", {
        callbackUrl: "/dashboard",
        redirect: true,
      });
    } catch (error) {
      setIsLoading(false);
      logger.error("OneLogin sign in failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      setError("Unable to sign in. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center h-full px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg px-8 py-10 space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-blue-600 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
                role="img"
                aria-label="Login icon"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                />
              </svg>
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Faculty Doorcard Login
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Sign in with your SMCCD OneLogin account
            </p>
          </div>

          {/* Display client-side errors */}
          {error && !urlError && (
            <div
              className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-md"
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Display URL-based OAuth errors */}
          {urlError &&
            (() => {
              const errorInfo = getAuthErrorInfo(urlError);
              const colors = getSeverityColorClasses(errorInfo.severity);
              const ErrorIcon =
                errorInfo.severity === "critical"
                  ? AlertCircle
                  : errorInfo.severity === "warning"
                    ? AlertTriangle
                    : InfoIcon;

              return (
                <div className="space-y-3">
                  <div
                    className={`${colors.bg} border ${colors.border} rounded-lg p-4`}
                    role="alert"
                    aria-live="assertive"
                  >
                    <div className="flex items-start gap-3">
                      <ErrorIcon
                        className={`h-5 w-5 ${colors.icon} flex-shrink-0 mt-0.5`}
                      />
                      <div className="flex-1">
                        <h3
                          className={`font-semibold ${colors.text} text-sm mb-1`}
                        >
                          {errorInfo.title}
                        </h3>
                        <p className={`text-sm ${colors.text}`}>
                          {errorInfo.description}
                        </p>

                        {errorInfo.steps && errorInfo.steps.length > 0 && (
                          <div className="mt-3">
                            <p className={`text-sm font-medium ${colors.text}`}>
                              What to do:
                            </p>
                            <ol className="mt-2 ml-4 list-decimal space-y-1">
                              {errorInfo.steps.map((step, index) => (
                                <li
                                  key={index}
                                  className={`text-sm ${colors.text}`}
                                >
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Show IT support contact for errors that need it */}
                  {errorInfo.showITSupport && <ITSupportContact />}

                  {/* Debug info in development */}
                  {process.env.NODE_ENV === "development" &&
                    errorInfo.technicalDetails && (
                      <details className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                        <summary className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                          Technical Details (Dev Only)
                        </summary>
                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-mono">
                          {errorInfo.technicalDetails}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                          Error code: {urlError}
                        </p>
                      </details>
                    )}
                </div>
              );
            })()}

          <div className="mt-8">
            <Button
              type="button"
              onClick={handleOneLoginSignIn}
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-3 py-3 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-describedby="onelogin-description"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    role="img"
                    aria-label="Loading"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Signing in...</span>
                  <span className="sr-only">
                    Please wait while we sign you in
                  </span>
                </>
              ) : (
                "Sign in with OneLogin"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
