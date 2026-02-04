"use client";

import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface DocsPageWrapperProps {
  content: string;
  showToc?: boolean;
}

export function DocsPageWrapper({ content }: DocsPageWrapperProps) {
  return (
    <main className="max-w-4xl mx-auto">
      {/* ADA Compliant Main Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <MarkdownRenderer content={content} />
      </div>

      {/* ADA Compliant Help Center Section */}
      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800/50">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Need Additional Assistance?
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Visit our Help Center for more resources and support options.
          </p>
          <Link
            href="https://support.smccd.edu/support/home"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-white dark:focus:ring-offset-gray-800"
            aria-label="Visit SMCCD Help Center (opens in new window)"
          >
            Visit SMCCD Help Center
            <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </main>
  );
}
