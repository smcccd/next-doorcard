// Mock dependencies first
jest.mock("marked", () => ({
  marked: {
    setOptions: jest.fn(),
    parse: jest.fn(),
  },
}));

import { parseMarkdown } from "../markdown";
import { marked } from "marked";

const mockParse = marked.parse as jest.MockedFunction<typeof marked.parse>;
const mockSetOptions = marked.setOptions as jest.MockedFunction<
  typeof marked.setOptions
>;

describe("Markdown Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParse.mockImplementation((text: string) => `<p>${text}</p>`);
  });

  describe("marked configuration", () => {
    it("should configure marked with correct options", () => {
      // Re-import the module to trigger setOptions call
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("../markdown");
        expect(mockSetOptions).toHaveBeenCalledWith({
          breaks: true,
          gfm: true,
        });
      });
    });
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

    it("should handle non-string return from marked.parse", () => {
      // Test the typeof check in the parseMarkdown function
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockParse.mockReturnValue({} as any); // Return non-string

      const result = parseMarkdown("test");

      expect(result).toBe("");
      expect(mockParse).toHaveBeenCalledWith("test");
    });

    it("should handle Promise return from marked.parse", () => {
      // Test edge case where marked.parse might return a Promise
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockParse.mockReturnValue(Promise.resolve("<p>async</p>") as any);

      const result = parseMarkdown("test");

      // Should return empty string for non-string results
      expect(result).toBe("");
    });

    it("should handle null markdown input", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = parseMarkdown(null as any);

      expect(mockParse).toHaveBeenCalledWith(null);
      expect(result).toBe("<p>null</p>");
    });

    it("should handle undefined markdown input", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = parseMarkdown(undefined as any);

      expect(mockParse).toHaveBeenCalledWith(undefined);
      expect(result).toBe("<p>undefined</p>");
    });

    it("should handle markdown with special characters", () => {
      const specialMarkdown = 'Hello & <world> "test"';

      const result = parseMarkdown(specialMarkdown);

      expect(mockParse).toHaveBeenCalledWith(specialMarkdown);
      expect(result).toBe('<p>Hello & <world> "test"</p>');
    });

    it("should return consistent error message format", () => {
      mockParse.mockImplementation(() => {
        throw new Error("Test error");
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = parseMarkdown("# Test");

      // Check exact error message structure
      expect(result).toBe(
        '<div class="p-4 bg-red-50 border border-red-200 rounded"><p class="text-red-700">Error parsing markdown content.</p></div>'
      );

      consoleSpy.mockRestore();
    });

    it("should handle different types of parsing errors", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      // Test with TypeError
      mockParse.mockImplementation(() => {
        throw new TypeError("Type error");
      });

      let result = parseMarkdown("test");
      expect(result).toContain("Error parsing markdown content");

      // Test with generic Error
      mockParse.mockImplementation(() => {
        throw new Error("Generic error");
      });

      result = parseMarkdown("test");
      expect(result).toContain("Error parsing markdown content");

      // Test with string error
      mockParse.mockImplementation(() => {
        throw "String error";
      });

      result = parseMarkdown("test");
      expect(result).toContain("Error parsing markdown content");

      consoleSpy.mockRestore();
    });
  });
});
