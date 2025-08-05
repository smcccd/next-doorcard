/**
 * Integration tests for filtering utilities
 * Tests the actual professor filtering logic with various scenarios
 */
import {
  filterProfessors,
  hasActiveFilters,
  getTopResults,
  type FilterOptions,
} from "../filtering";
import { PublicDoorcard } from "@/types/pages/public";
import { College } from "@/types/doorcard";
import { DayOfWeek } from "@prisma/client";
import { ActiveTermInfo } from "@/lib/active-term";

describe("Filtering Integration Tests", () => {
  // Mock data for testing
  const mockDoorcards: PublicDoorcard[] = [
    {
      id: "1",
      name: "Smith, John",
      doorcardName: "Dr. John Smith - MATH 101",
      college: "SKYLINE" as College,
      term: "FALL",
      year: 2024,
      appointmentCount: 5,
      availableDays: ["MONDAY", "WEDNESDAY", "FRIDAY"] as DayOfWeek[],
      user: { name: "John Smith - Mathematics Professor" },
    },
    {
      id: "2",
      name: "Johnson, Sarah",
      doorcardName: "Prof. Sarah Johnson - CS 110",
      college: "CSM" as College,
      term: "SPRING",
      year: 2024,
      appointmentCount: 8,
      availableDays: ["TUESDAY", "THURSDAY"] as DayOfWeek[],
      user: { name: "Sarah Johnson - Computer Science" },
    },
    {
      id: "3",
      name: "Brown, Michael",
      doorcardName: "Dr. Michael Brown - Biology Lab",
      college: "CANADA" as College,
      term: "FALL",
      year: 2024,
      appointmentCount: 3,
      availableDays: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
      ] as DayOfWeek[],
      user: { name: "Michael Brown - Biology Department" },
    },
    {
      id: "4",
      name: "Davis, Emily",
      doorcardName: "Emily Davis - ENGL 100",
      college: "SKYLINE" as College,
      term: "FALL",
      year: 2024,
      appointmentCount: 12,
      availableDays: ["WEDNESDAY", "FRIDAY"] as DayOfWeek[],
      user: { name: "Emily Davis - English Literature" },
    },
    {
      id: "5",
      name: "Wilson Robert",
      doorcardName: "Robert Wilson - MATH Statistics",
      college: "CSM" as College,
      term: "SPRING",
      year: 2024,
      appointmentCount: 1,
      availableDays: ["MONDAY"] as DayOfWeek[],
      user: { name: "Robert Wilson" },
    },
  ];

  const mockActiveTerm: ActiveTermInfo = {
    season: "FALL",
    year: 2024,
  };

  const defaultFilterOptions: FilterOptions = {
    searchTerm: "",
    selectedCampus: "ALL",
    selectedDepartment: "ALL",
    selectedDay: "ALL",
    activeLetter: null,
    showCurrentTermOnly: false,
    activeTerm: mockActiveTerm,
    termLoading: false,
  };

  describe("filterProfessors", () => {
    describe("campus filtering", () => {
      it("should filter by specific campus", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          selectedCampus: "SKYLINE",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(2);
        expect(result.every((dc) => dc.college === "SKYLINE")).toBe(true);
        expect(result.map((dc) => dc.id)).toEqual(["4", "1"]); // Sorted by appointment count desc, then name asc
      });

      it("should return all doorcards when campus is ALL", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          selectedCampus: "ALL",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(5);
      });

      it("should handle empty results for non-matching campus", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          selectedCampus: "SKYLINE",
        };

        const result = filterProfessors([], options);

        expect(result).toHaveLength(0);
      });
    });

    describe("department filtering", () => {
      it("should filter by department from name", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          selectedDepartment: "MATH",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(2);
        expect(result.map((dc) => dc.id)).toEqual(["1", "5"]); // Both MATH professors
      });

      it("should filter by department from doorcard name", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          selectedDepartment: "CS",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("2");
      });

      it("should filter by department from user name", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          selectedDepartment: "BIO",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("3");
      });

      it("should return all when department is ALL", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          selectedDepartment: "ALL",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(5);
      });
    });

    describe("term filtering", () => {
      it("should filter by current term when enabled", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          showCurrentTermOnly: true,
          activeTerm: mockActiveTerm,
          termLoading: false,
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(3); // Only FALL 2024 doorcards
        expect(
          result.every((dc) => dc.term === "FALL" && dc.year === 2024)
        ).toBe(true);
      });

      it("should not filter when term loading", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          showCurrentTermOnly: true,
          activeTerm: mockActiveTerm,
          termLoading: true,
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(5); // All doorcards returned
      });

      it("should not filter when no active term", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          showCurrentTermOnly: true,
          activeTerm: null,
          termLoading: false,
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(5); // All doorcards returned
      });

      it("should handle string year in active term", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          showCurrentTermOnly: true,
          activeTerm: { season: "FALL", year: "2024" },
          termLoading: false,
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(3); // FALL 2024 doorcards
      });
    });

    describe("search term filtering", () => {
      it("should filter by name", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          searchTerm: "Smith",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("1");
      });

      it("should filter by doorcard name", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          searchTerm: "Biology Lab",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("3");
      });

      it("should filter by user name", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          searchTerm: "Computer Science",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("2");
      });

      it("should be case insensitive", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          searchTerm: "JOHNSON",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("2");
      });

      it("should handle partial matches", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          searchTerm: "math",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(2); // Both MATH professors
      });
    });

    describe("letter filtering", () => {
      it("should filter by last name first letter (comma format)", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          activeLetter: "S",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("1"); // Smith, John
      });

      it("should filter by last name first letter (space format)", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          activeLetter: "R",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("5"); // Wilson Robert (last word is Robert)
      });

      it("should handle multiple matches", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          activeLetter: "B",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("3"); // Brown, Michael
      });

      it("should return empty for non-matching letter", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          activeLetter: "Z",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(0);
      });
    });

    describe("day filtering", () => {
      it("should filter by specific day", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          selectedDay: "FRIDAY",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(3); // Smith, Brown, Davis
        expect(result.every((dc) => dc.availableDays?.includes("FRIDAY"))).toBe(
          true
        );
      });

      it("should handle day with single professor", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          selectedDay: "MONDAY",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(3); // Smith, Brown, Wilson
      });

      it("should return all when day is ALL", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          selectedDay: "ALL",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(5);
      });
    });

    describe("sorting", () => {
      it("should sort by appointment count descending, then name ascending", () => {
        const result = filterProfessors(mockDoorcards, defaultFilterOptions);

        expect(result.map((dc) => dc.appointmentCount)).toEqual([
          12, 8, 5, 3, 1,
        ]);
        expect(result.map((dc) => dc.id)).toEqual(["4", "2", "1", "3", "5"]);
      });

      it("should handle equal appointment counts by sorting by name", () => {
        const doorcards = [
          { ...mockDoorcards[0], appointmentCount: 5, name: "Zebra, Adam" },
          { ...mockDoorcards[1], appointmentCount: 5, name: "Apple, Bob" },
        ];

        const result = filterProfessors(doorcards, defaultFilterOptions);

        expect(result[0].name).toBe("Apple, Bob");
        expect(result[1].name).toBe("Zebra, Adam");
      });
    });

    describe("combined filters", () => {
      it("should apply multiple filters correctly", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          selectedCampus: "SKYLINE",
          selectedDepartment: "MATH",
          selectedDay: "FRIDAY",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("1"); // Only Smith meets all criteria
      });

      it("should handle no matches with multiple filters", () => {
        const options: FilterOptions = {
          ...defaultFilterOptions,
          selectedCampus: "CANADA",
          selectedDepartment: "MATH",
        };

        const result = filterProfessors(mockDoorcards, options);

        expect(result).toHaveLength(0);
      });
    });
  });

  describe("hasActiveFilters", () => {
    it("should return false when no filters are active", () => {
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

    it("should return true when search term is active", () => {
      const options = {
        searchTerm: "test",
        selectedCampus: "ALL" as const,
        selectedDepartment: "ALL",
        activeLetter: null,
        selectedDay: "ALL" as const,
        showCurrentTermOnly: false,
      };

      expect(hasActiveFilters(options)).toBe(true);
    });

    it("should return true when campus filter is active", () => {
      const options = {
        searchTerm: "",
        selectedCampus: "SKYLINE" as const,
        selectedDepartment: "ALL",
        activeLetter: null,
        selectedDay: "ALL" as const,
        showCurrentTermOnly: false,
      };

      expect(hasActiveFilters(options)).toBe(true);
    });

    it("should return true when department filter is active", () => {
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

    it("should return true when letter filter is active", () => {
      const options = {
        searchTerm: "",
        selectedCampus: "ALL" as const,
        selectedDepartment: "ALL",
        activeLetter: "A",
        selectedDay: "ALL" as const,
        showCurrentTermOnly: false,
      };

      expect(hasActiveFilters(options)).toBe(true);
    });

    it("should return true when day filter is active", () => {
      const options = {
        searchTerm: "",
        selectedCampus: "ALL" as const,
        selectedDepartment: "ALL",
        activeLetter: null,
        selectedDay: "MONDAY" as const,
        showCurrentTermOnly: false,
      };

      expect(hasActiveFilters(options)).toBe(true);
    });
  });

  describe("getTopResults", () => {
    it("should return first 24 results when no filters active", () => {
      const manyDoorcards = Array.from({ length: 30 }, (_, i) => ({
        ...mockDoorcards[0],
        id: i.toString(),
        name: `Professor ${i}`,
      }));

      const result = getTopResults(manyDoorcards, false);

      expect(result).toHaveLength(24);
      expect(result[0].id).toBe("0");
      expect(result[23].id).toBe("23");
    });

    it("should return all results when filters are active", () => {
      const manyDoorcards = Array.from({ length: 30 }, (_, i) => ({
        ...mockDoorcards[0],
        id: i.toString(),
        name: `Professor ${i}`,
      }));

      const result = getTopResults(manyDoorcards, true);

      expect(result).toHaveLength(30);
    });

    it("should return all results if less than 24 and no filters", () => {
      const result = getTopResults(mockDoorcards, false);

      expect(result).toHaveLength(5);
      expect(result).toEqual(mockDoorcards);
    });
  });

  describe("edge cases", () => {
    it("should handle empty doorcards array", () => {
      const result = filterProfessors([], defaultFilterOptions);

      expect(result).toHaveLength(0);
    });

    it("should handle doorcard without user", () => {
      const doorcards = [{ ...mockDoorcards[0], user: null }];

      const options: FilterOptions = {
        ...defaultFilterOptions,
        searchTerm: "test",
      };

      const result = filterProfessors(doorcards, options);

      expect(result).toHaveLength(0);
    });

    it("should handle doorcard without availableDays", () => {
      const doorcards = [{ ...mockDoorcards[0], availableDays: null }];

      const options: FilterOptions = {
        ...defaultFilterOptions,
        selectedDay: "MONDAY",
      };

      const result = filterProfessors(doorcards, options);

      expect(result).toHaveLength(0);
    });

    it("should handle malformed names for letter filtering", () => {
      const doorcards = [
        { ...mockDoorcards[0], name: "" },
        { ...mockDoorcards[1], name: "   " },
        { ...mockDoorcards[2], name: "SingleName" },
      ];

      const options: FilterOptions = {
        ...defaultFilterOptions,
        activeLetter: "S",
      };

      const result = filterProfessors(doorcards, options);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("SingleName");
    });
  });
});
