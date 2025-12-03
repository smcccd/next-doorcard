"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import { Inter, Source_Sans_3 } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-source-sans",
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [eventId, setEventId] = useState<string | undefined>();

  useEffect(() => {
    // Capture exception and store event ID
    const id = Sentry.captureException(error);
    setEventId(id);
  }, [error]);

  return (
    <html lang="en" className={`${inter.variable} ${sourceSans.variable}`}>
      <body className="bg-gray-50 font-sans">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Application Error
              </h1>
              <p className="text-gray-600">
                A critical error occurred. Our team has been notified.
              </p>
            </div>

            {/* Event ID Display */}
            {eventId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Error Reference Number
                </p>
                <code className="text-sm font-mono text-gray-800 break-all block bg-white px-3 py-2 rounded border border-gray-200 select-all">
                  {eventId}
                </code>
                <p className="text-xs text-gray-500 mt-2">
                  Save this reference number for support
                </p>
              </div>
            )}

            {/* Next.js Digest (if available) */}
            {error.digest && (
              <div className="bg-blue-50 rounded-lg p-3 mb-6 text-sm">
                <p className="text-xs font-medium text-blue-700 mb-1">
                  Digest (Next.js)
                </p>
                <code className="text-xs font-mono text-blue-800">
                  {error.digest}
                </code>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = "/dashboard")}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Return to Dashboard
              </button>
              {eventId && (
                <button
                  onClick={() => Sentry.showReportDialog({ eventId })}
                  className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
                >
                  Report this issue to support
                </button>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
