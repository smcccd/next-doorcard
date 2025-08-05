import {
  DEPARTMENTS,
  extractDepartmentFromText,
  getDepartmentName,
  getAllDepartments,
} from "../departments";

describe("Departments Utils", () => {
  describe("DEPARTMENTS constant", () => {
    it("should have all expected departments", () => {
      expect(DEPARTMENTS.length).toBeGreaterThan(15);

      const departmentCodes = DEPARTMENTS.map((d) => d.code);
      expect(departmentCodes).toContain("MATH");
      expect(departmentCodes).toContain("CS");
      expect(departmentCodes).toContain("ENGL");
      expect(departmentCodes).toContain("BIO");
      expect(departmentCodes).toContain("CHEM");
    });

    it("should have proper structure for each department", () => {
      DEPARTMENTS.forEach((dept) => {
        expect(dept).toHaveProperty("code");
        expect(dept).toHaveProperty("name");
        expect(dept).toHaveProperty("searchTerms");

        expect(typeof dept.code).toBe("string");
        expect(typeof dept.name).toBe("string");
        expect(Array.isArray(dept.searchTerms)).toBe(true);
        expect(dept.searchTerms.length).toBeGreaterThan(0);
      });
    });

    it("should have unique department codes", () => {
      const codes = DEPARTMENTS.map((d) => d.code);
      const uniqueCodes = [...new Set(codes)];
      expect(codes.length).toBe(uniqueCodes.length);
    });
  });

  describe("extractDepartmentFromText", () => {
    it("should return null for empty or null input", () => {
      expect(extractDepartmentFromText("")).toBe(null);
      expect(extractDepartmentFromText(null as any)).toBe(null);
      expect(extractDepartmentFromText(undefined as any)).toBe(null);
    });

    it("should extract department from course codes", () => {
      expect(extractDepartmentFromText("CS 110")).toBe("CS");
      expect(extractDepartmentFromText("MATH 200")).toBe("MATH");
      expect(extractDepartmentFromText("BIO 101")).toBe("BIO");
      expect(extractDepartmentFromText("ENGL 1A")).toBe("ENGL");
    });

    it("should extract department from course codes without spaces", () => {
      expect(extractDepartmentFromText("CS110")).toBe("CS");
      expect(extractDepartmentFromText("MATH200")).toBe("MATH");
      expect(extractDepartmentFromText("BIO101")).toBe("BIO");
    });

    it("should extract department from search terms", () => {
      expect(extractDepartmentFromText("mathematics")).toBe("MATH");
      expect(extractDepartmentFromText("computer science")).toBe("CS");
      expect(extractDepartmentFromText("programming")).toBe("CS");
      expect(extractDepartmentFromText("algebra")).toBe("MATH");
      expect(extractDepartmentFromText("calculus")).toBe("MATH");
    });

    it("should be case insensitive", () => {
      expect(extractDepartmentFromText("MATHEMATICS")).toBe("MATH");
      expect(extractDepartmentFromText("Computer Science")).toBe("CS");
      expect(extractDepartmentFromText("PROGRAMMING")).toBe("CS");
      expect(extractDepartmentFromText("cs 110")).toBe("CS");
    });

    it("should handle text with multiple words", () => {
      expect(
        extractDepartmentFromText("Introduction to Computer Science")
      ).toBe("CS");
      expect(extractDepartmentFromText("Advanced Calculus and Analysis")).toBe(
        "MATH"
      );
      expect(extractDepartmentFromText("English Composition")).toBe("ENGL");
      expect(extractDepartmentFromText("Organic Chemistry Lab")).toBe("CHEM");
    });

    it("should return first match when multiple departments could match", () => {
      // Test that it returns consistently - the order depends on DEPARTMENTS array order
      const result = extractDepartmentFromText(
        "mathematics and computer science"
      );
      expect(result).toBeTruthy();
      expect(["MATH", "CS"]).toContain(result);
    });

    it("should return null for unrecognized text", () => {
      expect(extractDepartmentFromText("random text")).toBe(null);
      expect(extractDepartmentFromText("123456")).toBe(null);
      expect(extractDepartmentFromText("xyz")).toBe(null);
    });

    it("should handle specific search terms correctly", () => {
      expect(extractDepartmentFromText("anatomy")).toBe("BIO");
      expect(extractDepartmentFromText("physiology")).toBe("BIO");
      expect(extractDepartmentFromText("organic chemistry")).toBe("CHEM");
      expect(extractDepartmentFromText("behavioral psychology")).toBe("PSYC");
      expect(extractDepartmentFromText("web development")).toBe("CS");
    });

    it("should handle partial matches within words", () => {
      expect(extractDepartmentFromText("mathematical")).toBe("MATH");
      expect(extractDepartmentFromText("programming language")).toBe("CS");
      expect(extractDepartmentFromText("biological")).toBe("BIO");
    });
  });

  describe("getDepartmentName", () => {
    it("should return correct names for valid codes", () => {
      expect(getDepartmentName("MATH")).toBe("Mathematics");
      expect(getDepartmentName("CS")).toBe("Computer Science");
      expect(getDepartmentName("ENGL")).toBe("English");
      expect(getDepartmentName("BIO")).toBe("Biology");
      expect(getDepartmentName("CHEM")).toBe("Chemistry");
    });

    it("should return the code itself for unknown codes", () => {
      expect(getDepartmentName("UNKNOWN")).toBe("UNKNOWN");
      expect(getDepartmentName("XYZ")).toBe("XYZ");
      expect(getDepartmentName("")).toBe("");
    });

    it("should be case sensitive for codes", () => {
      expect(getDepartmentName("math")).toBe("math"); // lowercase code not found
      expect(getDepartmentName("MATH")).toBe("Mathematics");
    });

    it("should handle all department codes", () => {
      DEPARTMENTS.forEach((dept) => {
        expect(getDepartmentName(dept.code)).toBe(dept.name);
      });
    });
  });

  describe("getAllDepartments", () => {
    it("should return the complete departments array", () => {
      const result = getAllDepartments();
      expect(result).toBe(DEPARTMENTS);
      expect(result.length).toBe(DEPARTMENTS.length);
    });

    it("should return departments with all required properties", () => {
      const result = getAllDepartments();
      result.forEach((dept) => {
        expect(dept).toHaveProperty("code");
        expect(dept).toHaveProperty("name");
        expect(dept).toHaveProperty("searchTerms");
      });
    });

    it("should return the same reference as DEPARTMENTS", () => {
      const result = getAllDepartments();
      expect(result).toBe(DEPARTMENTS);
    });
  });

  describe("search term coverage", () => {
    it("should have comprehensive search terms for major departments", () => {
      const mathDept = DEPARTMENTS.find((d) => d.code === "MATH");
      expect(mathDept?.searchTerms).toContain("math");
      expect(mathDept?.searchTerms).toContain("mathematics");
      expect(mathDept?.searchTerms).toContain("calculus");

      const csDept = DEPARTMENTS.find((d) => d.code === "CS");
      expect(csDept?.searchTerms).toContain("cs");
      expect(csDept?.searchTerms).toContain("computer science");
      expect(csDept?.searchTerms).toContain("programming");
    });

    it("should have lowercase search terms", () => {
      DEPARTMENTS.forEach((dept) => {
        dept.searchTerms.forEach((term) => {
          expect(term).toBe(term.toLowerCase());
        });
      });
    });
  });
});
