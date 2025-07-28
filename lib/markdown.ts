import { marked } from 'marked';
import hljs from 'highlight.js';

// Simple configuration without custom renderer to avoid token object issues
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.error('Highlight.js error:', err);
      }
    }
    return code; // Return plain code if highlighting fails
  },
  breaks: true,
  gfm: true,
});

export function parseMarkdown(markdown: string): string {
  try {
    // Just parse with marked - let prose handle the styling
    return marked(markdown);
  } catch (error) {
    console.error('Markdown parsing failed:', error);
    return `<div class="p-4 bg-red-50 border border-red-200 rounded"><p class="text-red-700">Error parsing markdown content.</p></div>`;
  }
}