// Mock dependencies first
const mockMarked = jest.fn();
const mockHighlight = jest.fn();
const mockGetLanguage = jest.fn();

jest.mock("marked", () => ({
  marked: mockMarked,
}));

jest.mock("highlight.js", () => ({
  getLanguage: mockGetLanguage,
  highlight: mockHighlight,
}));

import { parseMarkdown } from "../markdown";

describe("Markdown Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMarked.mockImplementation((text: string) => `<p>${text}</p>`);
    mockGetLanguage.mockReturnValue(true);
    mockHighlight.mockReturnValue({ value: "highlighted-code" });
  });

  describe("parseMarkdown", () => {
    it("should parse simple markdown", () => {
      const markdown = "Hello **world**";
      const result = parseMarkdown(markdown);

      expect(result).toBe("<p>Hello **world**</p>");
      expect(mockMarked).toHaveBeenCalledWith(markdown);
    });

    it("should handle empty markdown", () => {
      const result = parseMarkdown("");

      expect(result).toBe("<p></p>");
      expect(mockMarked).toHaveBeenCalledWith("");
    });

    it("should handle markdown with line breaks", () => {
      const markdown = "Line 1\nLine 2";
      const result = parseMarkdown(markdown);

      expect(result).toBe("<p>Line 1\nLine 2</p>");
    });

    it("should handle errors gracefully", () => {
      mockMarked.mockImplementation(() => {
        throw new Error("Parsing error");
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = parseMarkdown("# Test");

      expect(result).toContain("Error parsing markdown content");
      expect(result).toContain("bg-red-50");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Markdown parsing failed:",
        expect.any(Error),
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
      expect(mockMarked).toHaveBeenCalledWith(complexMarkdown);
      expect(result).toContain("Header");
    });
  });
});
