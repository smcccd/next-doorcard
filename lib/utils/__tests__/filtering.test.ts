import { DayOfWeek, TermSeason } from "@prisma/client";
import { PublicDoorcard } from "@/types/pages/public";
import { College } from "@/types/doorcard";
import {
  filterProfessors,
  hasActiveFilters,
  getTopResults,
  FilterOptions,
} from "../filtering";

// Mock the departments module
jest.mock("@/lib/departments", () => ({
  extractDepartmentFromText: jest.fn((text: string) => {
    if (text.toLowerCase().includes("math")) return "MATH";
    if (
      text.toLowerCase().includes("computer") ||
      text.toLowerCase().includes("cs")
    )
      return "CS";
    if (text.toLowerCase().includes("english")) return "ENGL";
    return null;
  }),
}));

describe("Filtering Utils", () => {
  const mockDoorcards: PublicDoorcard[] = [
    {
      id: "1",
      name: "Dr. John Smith",
      doorcardName: "John Smith - Mathematics",
      college: "SKYLINE",
      term: "FALL",
      year: 2024,
      appointmentCount: 5,
      availableDays: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
      user: { name: "Dr. John Smith", username: "jsmith" },
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
    {
      id: "2",
      name: "Prof. Jane Doe",
      doorcardName: "Jane Doe - Computer Science",
      college: "CSM",
      term: "FALL",
      year: 2024,
      appointmentCount: 8,
      availableDays: [DayOfWeek.TUESDAY, DayOfWeek.THURSDAY],
      user: { name: "Prof. Jane Doe", username: "jdoe" },
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
    {
      id: "3",
      name: "Dr. Bob Wilson",
      doorcardName: "Bob Wilson - English Literature",
      college: "CANADA",
      term: "SPRING",
      year: 2024,
      appointmentCount: 3,
      availableDays: [DayOfWeek.MONDAY, DayOfWeek.FRIDAY],
      user: { name: "Dr. Bob Wilson", username: "bwilson" },
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
    {
      id: "4",
      name: "Smith, Alice",
      doorcardName: "Alice Smith - Advanced Math",
      college: "SKYLINE",
      term: "FALL",
      year: 2024,
      appointmentCount: 10,
      availableDays: [DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
      user: { name: "Alice Smith", username: "asmith" },
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
  ];

  const defaultOptions: FilterOptions = {
    searchTerm: "",
    selectedCampus: "ALL",
    selectedDepartment: "ALL",
    selectedDay: "ALL",
    activeLetter: null,
    showCurrentTermOnly: false,
    activeTerm: null,
    termLoading: false,
  };

  describe("filterProfessors", () => {
    it("should return all doorcards with no filters", () => {
      const result = filterProfessors(mockDoorcards, defaultOptions);
      expect(result).toHaveLength(4);
    });

    it("should filter by campus", () => {
      const options = {
        ...defaultOptions,
        selectedCampus: "SKYLINE" as College,
      };
      const result = filterProfessors(mockDoorcards, options);

      expect(result).toHaveLength(2);
      expect(result.every((dc) => dc.college === "SKYLINE")).toBe(true);
    });

    it("should filter by department", () => {
      const options = { ...defaultOptions, selectedDepartment: "MATH" };
      const result = filterProfessors(mockDoorcards, options);

      expect(result).toHaveLength(2);
      expect(
        result.every(
          (dc) =>
            dc.doorcardName.toLowerCase().includes("math") ||
            dc.name.toLowerCase().includes("math")
        )
      ).toBe(true);
    });

    it("should filter by search term", () => {
      const options = { ...defaultOptions, searchTerm: "john" };
      const result = filterProfessors(mockDoorcards, options);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Dr. John Smith");
    });

    it("should filter by letter (last name)", () => {
      const options = { ...defaultOptions, activeLetter: "S" };
      const result = filterProfessors(mockDoorcards, options);

      expect(result).toHaveLength(2);
      expect(
        result.every((dc) => {
          const name = dc.name;
          const lastNameFirst = name.includes(",")
            ? name.split(",")[0].trim()
            : name.split(" ").pop() || "";
          return lastNameFirst.toUpperCase().startsWith("S");
        })
      ).toBe(true);
    });

    it("should filter by available day", () => {
      const options = { ...defaultOptions, selectedDay: DayOfWeek.MONDAY };
      const result = filterProfessors(mockDoorcards, options);

      expect(result).toHaveLength(2);
      expect(
        result.every((dc) => dc.availableDays?.includes(DayOfWeek.MONDAY))
      ).toBe(true);
    });

    it("should filter by current term only", () => {
      const activeTerm = {
        season: TermSeason.FALL,
        year: 2024,
        displayName: "Fall 2024",
        isFromDatabase: false,
      };

      const options = {
        ...defaultOptions,
        showCurrentTermOnly: true,
        activeTerm,
        termLoading: false,
      };

      const result = filterProfessors(mockDoorcards, options);

      expect(result).toHaveLength(3);
      expect(
        result.every(
          (dc) => dc.term.toUpperCase() === "FALL" && dc.year === 2024
        )
      ).toBe(true);
    });

    it("should not filter by current term when termLoading is true", () => {
      const activeTerm = {
        season: TermSeason.FALL,
        year: 2024,
        displayName: "Fall 2024",
        isFromDatabase: false,
      };

      const options = {
        ...defaultOptions,
        showCurrentTermOnly: true,
        activeTerm,
        termLoading: true, // Still loading
      };

      const result = filterProfessors(mockDoorcards, options);

      // Should return all doorcards since term is still loading
      expect(result).toHaveLength(4);
    });

    it("should handle multiple filters", () => {
      const options = {
        ...defaultOptions,
        selectedCampus: "SKYLINE" as College,
        selectedDepartment: "MATH",
        searchTerm: "smith",
      };

      const result = filterProfessors(mockDoorcards, options);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Dr. John Smith");
    });

    it("should sort results by appointment count desc, then name asc", () => {
      const result = filterProfessors(mockDoorcards, defaultOptions);

      // Should be sorted by appointment count (desc), then name (asc)
      expect(result[0].appointmentCount).toBe(10); // Alice Smith
      expect(result[1].appointmentCount).toBe(8); // Jane Doe
      expect(result[2].appointmentCount).toBe(5); // John Smith
      expect(result[3].appointmentCount).toBe(3); // Bob Wilson
    });

    it("should handle comma-separated names for letter filtering", () => {
      const options = { ...defaultOptions, activeLetter: "S" };
      const result = filterProfessors(mockDoorcards, options);

      // Should include "Smith, Alice" (last name comes first)
      expect(result.some((dc) => dc.name === "Smith, Alice")).toBe(true);
    });

    it("should handle year as string in activeTerm", () => {
      const activeTerm = {
        season: TermSeason.FALL,
        year: "2024" as any, // Test string year
        displayName: "Fall 2024",
        isFromDatabase: false,
      };

      const options = {
        ...defaultOptions,
        showCurrentTermOnly: true,
        activeTerm,
        termLoading: false,
      };

      const result = filterProfessors(mockDoorcards, options);
      expect(result).toHaveLength(3);
    });
  });

  describe("hasActiveFilters", () => {
    it("should return false for default options", () => {
      const options = {
        searchTerm: "",
        selectedCampus: "ALL" as const,
        selectedDepartment: "ALL",
        activeLetter: null,
        selectedDay: "ALL" as const,
        showCurrentTermOnly: false,
      };

      expect(hasActiveFilters(options)).toBe(false);
    });

    it("should return true when search term is provided", () => {
      const options = {
        searchTerm: "john",
        selectedCampus: "ALL" as const,
        selectedDepartment: "ALL",
        activeLetter: null,
        selectedDay: "ALL" as const,
        showCurrentTermOnly: false,
      };

      expect(hasActiveFilters(options)).toBe(true);
    });

    it("should return true when campus is selected", () => {
      const options = {
        searchTerm: "",
        selectedCampus: "SKYLINE" as College,
        selectedDepartment: "ALL",
        activeLetter: null,
        selectedDay: "ALL" as const,
        showCurrentTermOnly: false,
      };

      expect(hasActiveFilters(options)).toBe(true);
    });

    it("should return true when department is selected", () => {
      const options = {
        searchTerm: "",
        selectedCampus: "ALL" as const,
        selectedDepartment: "MATH",
        activeLetter: null,
        selectedDay: "ALL" as const,
        showCurrentTermOnly: false,
      };

      expect(hasActiveFilters(options)).toBe(true);
    });

    it("should return true when letter is active", () => {
      const options = {
        searchTerm: "",
        selectedCampus: "ALL" as const,
        selectedDepartment: "ALL",
        activeLetter: "S",
        selectedDay: "ALL" as const,
        showCurrentTermOnly: false,
      };

      expect(hasActiveFilters(options)).toBe(true);
    });

    it("should return true when day is selected", () => {
      const options = {
        searchTerm: "",
        selectedCampus: "ALL" as const,
        selectedDepartment: "ALL",
        activeLetter: null,
        selectedDay: DayOfWeek.MONDAY,
        showCurrentTermOnly: false,
      };

      expect(hasActiveFilters(options)).toBe(true);
    });
  });

  describe("getTopResults", () => {
    const manyDoorcards = Array.from({ length: 30 }, (_, i) => ({
      ...mockDoorcards[0],
      id: `card-${i}`,
      name: `Professor ${i}`,
      appointmentCount: i,
    }));

    it("should return top 24 results when no filters are active", () => {
      const result = getTopResults(manyDoorcards, false);
      expect(result).toHaveLength(24);
    });

    it("should return all results when filters are active", () => {
      const result = getTopResults(manyDoorcards, true);
      expect(result).toHaveLength(30);
    });

    it("should return all results if less than 24 total", () => {
      const result = getTopResults(mockDoorcards, false);
      expect(result).toHaveLength(4);
    });

    it("should preserve order of input array", () => {
      const result = getTopResults(manyDoorcards, false);
      expect(result[0].id).toBe("card-0");
      expect(result[1].id).toBe("card-1");
      expect(result[23].id).toBe("card-23");
    });
  });
});
