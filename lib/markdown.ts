import { marked } from "marked";

// Simple configuration without custom renderer to avoid token object issues
marked.setOptions({
  breaks: true,
  gfm: true,
});

export function parseMarkdown(markdown: string): string {
  try {
    // Force synchronous parsing by calling marked.parse directly
    const result = marked.parse(markdown);
    return typeof result === "string" ? result : "";
  } catch (error) {
    console.error("Markdown parsing failed:", error);
    return `<div class="p-4 bg-red-50 border border-red-200 rounded"><p class="text-red-700">Error parsing markdown content.</p></div>`;
  }
}
