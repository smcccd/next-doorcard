/**
 * Integration tests for department utilities
 * Tests the actual department data and functions
 */
import {
  DEPARTMENTS,
  extractDepartmentFromText,
  getDepartmentName,
  getAllDepartments,
  type Department,
} from "../departments";

describe("Departments Integration Tests", () => {
  describe("DEPARTMENTS data", () => {
    it("should have valid department structure", () => {
      expect(DEPARTMENTS).toBeDefined();
      expect(Array.isArray(DEPARTMENTS)).toBe(true);
      expect(DEPARTMENTS.length).toBeGreaterThan(0);

      // Verify each department has required fields
      DEPARTMENTS.forEach((dept: Department) => {
        expect(dept).toHaveProperty("code");
        expect(dept).toHaveProperty("name");
        expect(dept).toHaveProperty("searchTerms");
        expect(typeof dept.code).toBe("string");
        expect(typeof dept.name).toBe("string");
        expect(Array.isArray(dept.searchTerms)).toBe(true);
        expect(dept.code.length).toBeGreaterThan(0);
        expect(dept.name.length).toBeGreaterThan(0);
        expect(dept.searchTerms.length).toBeGreaterThan(0);
      });
    });

    it("should have unique department codes", () => {
      const codes = DEPARTMENTS.map((dept) => dept.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it("should include common departments", () => {
      const codes = DEPARTMENTS.map((dept) => dept.code);
      expect(codes).toContain("MATH");
      expect(codes).toContain("CS");
      expect(codes).toContain("ENGL");
    });
  });

  describe("extractDepartmentFromText", () => {
    it("should extract department from course codes", () => {
      expect(extractDepartmentFromText("MATH 101")).toBe("MATH");
      expect(extractDepartmentFromText("CS 110")).toBe("CS");
      expect(extractDepartmentFromText("ENGL 100")).toBe("ENGL");
    });

    it("should extract department from descriptive text", () => {
      expect(extractDepartmentFromText("Teaching calculus and algebra")).toBe(
        "MATH"
      );
      expect(extractDepartmentFromText("Computer science programming")).toBe(
        "CS"
      );
      expect(
        extractDepartmentFromText("English composition and literature")
      ).toBe("ENGL");
    });

    it("should be case insensitive", () => {
      expect(extractDepartmentFromText("math 101")).toBe("MATH");
      expect(extractDepartmentFromText("Computer Science")).toBe("CS");
      expect(extractDepartmentFromText("PROGRAMMING")).toBe("CS");
    });

    it("should return null for unmatched text", () => {
      expect(extractDepartmentFromText("Random unrelated text")).toBeNull();
      expect(extractDepartmentFromText("")).toBeNull();
      expect(extractDepartmentFromText("XYZ 999")).toBeNull();
    });

    it("should handle multiple matches by returning first", () => {
      // Text that could match multiple departments should return first match
      const result = extractDepartmentFromText("MATH and CS courses");
      expect(result).toBe("MATH"); // Assuming MATH comes first in search order
    });
  });

  describe("getDepartmentName", () => {
    it("should return correct names for valid codes", () => {
      expect(getDepartmentName("MATH")).toBe("Mathematics");
      expect(getDepartmentName("CS")).toBe("Computer Science");
      expect(getDepartmentName("ENGL")).toBe("English");
    });

    it("should be case sensitive (matches exact code)", () => {
      expect(getDepartmentName("MATH")).toBe("Mathematics");
      expect(getDepartmentName("CS")).toBe("Computer Science");
      expect(getDepartmentName("ENGL")).toBe("English");
    });

    it("should return code itself for case mismatches", () => {
      expect(getDepartmentName("math")).toBe("math");
      expect(getDepartmentName("cs")).toBe("cs");
      expect(getDepartmentName("Engl")).toBe("Engl");
    });

    it("should return the code itself for unknown departments", () => {
      expect(getDepartmentName("UNKNOWN")).toBe("UNKNOWN");
      expect(getDepartmentName("XYZ")).toBe("XYZ");
      expect(getDepartmentName("")).toBe("");
    });
  });

  describe("getAllDepartments", () => {
    it("should return all departments", () => {
      const allDepts = getAllDepartments();
      expect(allDepts).toEqual(DEPARTMENTS);
      expect(allDepts.length).toBe(DEPARTMENTS.length);
    });

    it("should return the original departments array", () => {
      const allDepts = getAllDepartments();
      expect(allDepts).toBe(DEPARTMENTS); // Same reference
      expect(allDepts).toEqual(DEPARTMENTS); // Same content
    });
  });

  describe("real-world usage scenarios", () => {
    it("should handle typical professor bio text", () => {
      const bioText =
        "Dr. Smith teaches calculus and statistics in the Mathematics department";
      expect(extractDepartmentFromText(bioText)).toBe("MATH");
    });

    it("should handle course schedule descriptions", () => {
      expect(extractDepartmentFromText("MATH 110 - College Algebra")).toBe(
        "MATH"
      );
      expect(extractDepartmentFromText("CS 131 - Web Development")).toBe("CS");
    });

    it("should handle office hours descriptions", () => {
      expect(
        extractDepartmentFromText("Office hours for programming students")
      ).toBe("CS");
      expect(extractDepartmentFromText("Help with algebra and geometry")).toBe(
        "MATH"
      );
    });
  });
});
