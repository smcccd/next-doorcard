import { marked } from "marked";
import DOMPurify from "dompurify";

// Simple configuration without custom renderer to avoid token object issues
marked.setOptions({
  breaks: true,
  gfm: true,
});

// DOMPurify configuration for markdown content
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "br", "hr",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "a", "strong", "em", "del", "s",
    "table", "thead", "tbody", "tr", "th", "td",
    "img", "figure", "figcaption",
    "div", "span",
  ],
  ALLOWED_ATTR: [
    "href", "title", "target", "rel",
    "src", "alt", "width", "height",
    "class", "id",
    "colspan", "rowspan",
  ],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ["target"], // Allow target="_blank" for links
};

export function parseMarkdown(markdown: string): string {
  try {
    // Force synchronous parsing by calling marked.parse directly
    const result = marked.parse(markdown);
    const html = typeof result === "string" ? result : "";

    // Sanitize the HTML output to prevent XSS
    return DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
  } catch (error) {
    console.error("Markdown parsing failed:", error);
    return `<div class="p-4 bg-red-50 border border-red-200 rounded"><p class="text-red-700">Error parsing markdown content.</p></div>`;
  }
}
