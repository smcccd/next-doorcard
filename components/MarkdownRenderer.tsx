"use client";

import { useState, useMemo } from "react";
import { parseMarkdown } from "@/lib/markdown";
import "highlight.js/styles/github-dark.css";
import "./markdown.css";

interface MarkdownRendererProps {
  content: string;
  showToc?: boolean;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [error, setError] = useState<string | null>(null);

  // Memoize expensive operations
  const parsedHtml = useMemo(() => {
    try {
      setError(null);
      return parseMarkdown(content);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error parsing markdown";
      setError(errorMessage);
      return '<p class="text-red-600">Error parsing content</p>';
    }
  }, [content]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Content Error</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="markdown-content">
      <div dangerouslySetInnerHTML={{ __html: parsedHtml }} />
    </div>
  );
}
