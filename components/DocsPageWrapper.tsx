"use client";

import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface DocsPageWrapperProps {
  content: string;
  showToc?: boolean;
}

export function DocsPageWrapper({ content }: DocsPageWrapperProps) {
  return (
    <main className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <MarkdownRenderer content={content} />
      </div>

      {/* Help Center Button */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Need Additional Assistance?
          </h3>
          <p className="text-gray-700 mb-4">
            Visit our Help Center for more resources and support options.
          </p>
          <Link
            href="https://support.smccd.edu/support/home"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Visit SMCCD Help Center
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
