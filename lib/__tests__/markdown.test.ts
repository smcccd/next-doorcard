// Mock dependencies first
jest.mock("marked", () => ({
  marked: {
    setOptions: jest.fn(),
    parse: jest.fn(),
  },
}));

jest.mock("highlight.js", () => ({
  getLanguage: jest.fn(),
  highlight: jest.fn(),
}));

import { parseMarkdown } from "../markdown";
import { marked } from "marked";
import hljs from "highlight.js";

const mockParse = marked.parse as jest.MockedFunction<typeof marked.parse>;
const mockGetLanguage = hljs.getLanguage as jest.MockedFunction<
  typeof hljs.getLanguage
>;
const mockHighlight = hljs.highlight as jest.MockedFunction<
  typeof hljs.highlight
>;

describe("Markdown Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParse.mockImplementation((text: string) => `<p>${text}</p>`);
    mockGetLanguage.mockReturnValue(true);
    mockHighlight.mockReturnValue({ value: "highlighted-code" } as any);
  });

  describe("parseMarkdown", () => {
    it("should parse simple markdown", () => {
      const markdown = "Hello **world**";
      const result = parseMarkdown(markdown);

      expect(result).toBe("<p>Hello **world**</p>");
      expect(mockParse).toHaveBeenCalledWith(markdown);
    });

    it("should handle empty markdown", () => {
      const result = parseMarkdown("");

      expect(result).toBe("<p></p>");
      expect(mockParse).toHaveBeenCalledWith("");
    });

    it("should handle markdown with line breaks", () => {
      const markdown = "Line 1\nLine 2";
      const result = parseMarkdown(markdown);

      expect(result).toBe("<p>Line 1\nLine 2</p>");
    });

    it("should handle errors gracefully", () => {
      mockParse.mockImplementation(() => {
        throw new Error("Parsing error");
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = parseMarkdown("# Test");

      expect(result).toContain("Error parsing markdown content");
      expect(result).toContain("bg-red-50");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Markdown parsing failed:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should handle complex markdown structures", () => {
      const complexMarkdown = `
# Header
- List item 1
- List item 2

\`\`\`javascript
console.log('code');
\`\`\`
      `;

      const result = parseMarkdown(complexMarkdown);
      // Just verify it calls marked with the content
      expect(mockParse).toHaveBeenCalledWith(complexMarkdown);
      expect(result).toContain("Header");
    });
  });
});
