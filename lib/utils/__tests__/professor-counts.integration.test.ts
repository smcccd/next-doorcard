/**
 * Integration tests for professor counts utilities
 * Tests the actual professor counting logic with various scenarios
 */
import {
  calculateProfessorCounts,
  type CountOptions,
} from "../professor-counts";
import { PublicDoorcard } from "@/types/pages/public";
import { College } from "@/types/doorcard";
import { DayOfWeek } from "@prisma/client";
import { ActiveTermInfo } from "@/lib/term/active-term";

describe("Professor Counts Integration Tests", () => {
  // Mock data for testing
  const mockDoorcards: PublicDoorcard[] = [
    {
      id: "1",
      name: "Anderson, John",
      doorcardName: "Dr. John Anderson - MATH 101",
      college: "SKYLINE" as College,
      term: "FALL",
      year: 2024,
      appointmentCount: 5,
      availableDays: ["MONDAY", "WEDNESDAY", "FRIDAY"] as DayOfWeek[],
      user: { name: "John Anderson - Mathematics Professor" },
    },
    {
      id: "2",
      name: "Brown, Sarah",
      doorcardName: "Prof. Sarah Brown - CS 110",
      college: "CSM" as College,
      term: "SPRING",
      year: 2024,
      appointmentCount: 8,
      availableDays: ["TUESDAY", "THURSDAY"] as DayOfWeek[],
      user: { name: "Sarah Brown - Computer Science" },
    },
    {
      id: "3",
      name: "Chen, Michael",
      doorcardName: "Dr. Michael Chen - Biology Lab",
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
      user: { name: "Michael Chen - Biology Department" },
    },
    {
      id: "4",
      name: "Davis, Emily",
      doorcardName: "Emily Davis - ENGL 100",
      college: "SKYLINE" as College,
      term: "FALL",
      year: 2023,
      appointmentCount: 12,
      availableDays: ["WEDNESDAY", "FRIDAY"] as DayOfWeek[],
      user: { name: "Emily Davis - English Literature" },
    },
    {
      id: "5",
      name: "Evans, Robert",
      doorcardName: "Robert Evans - MATH Statistics",
      college: "CSM" as College,
      term: "SPRING",
      year: 2024,
      appointmentCount: 1,
      availableDays: ["MONDAY"] as DayOfWeek[],
      user: { name: "Robert Evans" },
    },
    {
      id: "6",
      name: "Adams, Lisa",
      doorcardName: "Dr. Lisa Adams - PHYS 101",
      college: "SKYLINE" as College,
      term: "FALL",
      year: 2024,
      appointmentCount: 7,
      availableDays: ["TUESDAY", "THURSDAY"] as DayOfWeek[],
      user: { name: "Lisa Adams - PHYS Department" },
    },
    {
      id: "7",
      name: "Baker, Mark",
      doorcardName: "Mark Baker - Chemistry",
      college: "CANADA" as College,
      term: "FALL",
      year: 2024,
      appointmentCount: 4,
      availableDays: ["MONDAY", "WEDNESDAY"] as DayOfWeek[],
      user: { name: "Mark Baker" },
    },
  ];

  const mockActiveTerm: ActiveTermInfo = {
    season: "FALL",
    year: 2024,
  };

  const defaultCountOptions: CountOptions = {
    selectedCampus: "ALL",
    selectedDepartment: "ALL",
    selectedDay: "ALL",
    searchTerm: "",
    showCurrentTermOnly: false,
    activeTerm: mockActiveTerm,
    termLoading: false,
  };

  describe("calculateProfessorCounts", () => {
    describe("basic counting functionality", () => {
      it("should count professors by first letter of last name", () => {
        const result = calculateProfessorCounts(
          mockDoorcards,
          defaultCountOptions
        );

        expect(result).toEqual({
          A: 2, // Anderson, Adams
          B: 2, // Brown, Baker
          C: 1, // Chen
          D: 1, // Davis
          E: 1, // Evans
        });
      });

      it("should handle comma-separated names (Last, First)", () => {
        const doorcards = [
          { ...mockDoorcards[0], name: "Smith, John" },
          { ...mockDoorcards[1], name: "Jones, Sarah" },
        ];

        const result = calculateProfessorCounts(doorcards, defaultCountOptions);

        expect(result).toEqual({
          S: 1, // Smith
          J: 1, // Jones
        });
      });

      it("should handle space-separated names (First Last)", () => {
        const doorcards = [
          { ...mockDoorcards[0], name: "John Wilson" },
          { ...mockDoorcards[1], name: "Sarah Taylor" },
        ];

        const result = calculateProfessorCounts(doorcards, defaultCountOptions);

        expect(result).toEqual({
          W: 1, // Wilson
          T: 1, // Taylor
        });
      });

      it("should only count letters A-Z", () => {
        const doorcards = [
          { ...mockDoorcards[0], name: "123, Number" },
          { ...mockDoorcards[1], name: "Smith, John" },
          { ...mockDoorcards[2], name: "!@#$%" },
        ];

        const result = calculateProfessorCounts(doorcards, defaultCountOptions);

        expect(result).toEqual({
          S: 1, // Only Smith counted
        });
      });

      it("should be case insensitive for counting", () => {
        const doorcards = [
          { ...mockDoorcards[0], name: "smith, john" },
          { ...mockDoorcards[1], name: "JONES, SARAH" },
        ];

        const result = calculateProfessorCounts(doorcards, defaultCountOptions);

        expect(result).toEqual({
          S: 1,
          J: 1,
        });
      });
    });

    describe("campus filtering", () => {
      it("should count only selected campus professors", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          selectedCampus: "SKYLINE",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        expect(result).toEqual({
          A: 2, // Anderson, Adams (both SKYLINE)
          D: 1, // Davis (SKYLINE)
        });
      });

      it("should return empty counts for campus with no professors", () => {
        const doorcards = [mockDoorcards[0]]; // Only one professor at SKYLINE
        const options: CountOptions = {
          ...defaultCountOptions,
          selectedCampus: "CSM",
        };

        const result = calculateProfessorCounts(doorcards, options);

        expect(result).toEqual({});
      });

      it("should count all when campus is ALL", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          selectedCampus: "ALL",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        expect(Object.keys(result)).toHaveLength(5); // A, B, C, D, E
        expect(Object.values(result).reduce((a, b) => a + b, 0)).toBe(7); // Total professors
      });
    });

    describe("department filtering", () => {
      it("should count professors from specific department", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          selectedDepartment: "MATH",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        expect(result).toEqual({
          A: 1, // Anderson (MATH)
          E: 1, // Evans (MATH Statistics)
        });
      });

      it("should extract department from doorcard name", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          selectedDepartment: "CS",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        expect(result).toEqual({
          B: 1, // Brown (CS 110)
        });
      });

      it("should extract department from user name", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          selectedDepartment: "BIO",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        expect(result).toEqual({
          C: 1, // Chen (Biology Department)
        });
      });

      it("should return empty for non-matching department", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          selectedDepartment: "UNKNOWN",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        expect(result).toEqual({});
      });
    });

    describe("term filtering", () => {
      it("should count only current term professors when enabled", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          showCurrentTermOnly: true,
          activeTerm: mockActiveTerm,
          termLoading: false,
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        // Should only count FALL 2024 professors: Anderson, Chen, Adams, Baker
        expect(result).toEqual({
          A: 2, // Anderson, Adams
          C: 1, // Chen
          B: 1, // Baker
        });
      });

      it("should count all when term loading", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          showCurrentTermOnly: true,
          activeTerm: mockActiveTerm,
          termLoading: true,
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        expect(Object.values(result).reduce((a, b) => a + b, 0)).toBe(7); // All professors
      });

      it("should count all when no active term", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          showCurrentTermOnly: true,
          activeTerm: null,
          termLoading: false,
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        expect(Object.values(result).reduce((a, b) => a + b, 0)).toBe(7); // All professors
      });

      it("should handle string year in active term", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          showCurrentTermOnly: true,
          activeTerm: { season: "FALL", year: "2024" },
          termLoading: false,
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        // Should match FALL 2024 professors
        expect(Object.values(result).reduce((a, b) => a + b, 0)).toBe(4);
      });
    });

    describe("search term filtering", () => {
      it("should count professors matching search in name", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          searchTerm: "Anderson",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        expect(result).toEqual({
          A: 1, // Anderson
        });
      });

      it("should count professors matching search in doorcard name", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          searchTerm: "Biology Lab",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        expect(result).toEqual({
          C: 1, // Chen
        });
      });

      it("should count professors matching search in user name", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          searchTerm: "Computer Science",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        expect(result).toEqual({
          B: 1, // Brown
        });
      });

      it("should be case insensitive for search", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          searchTerm: "PHYS",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        expect(result).toEqual({
          A: 1, // Adams
        });
      });

      it("should handle partial matches", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          searchTerm: "math",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        expect(result).toEqual({
          A: 1, // Anderson (MATH)
          E: 1, // Evans (MATH Statistics)
        });
      });
    });

    describe("day filtering", () => {
      it("should count professors available on specific day", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          selectedDay: "MONDAY",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        // Anderson, Chen, Evans, Baker are available on Monday
        expect(result).toEqual({
          A: 1, // Anderson
          C: 1, // Chen
          E: 1, // Evans
          B: 1, // Baker
        });
      });

      it("should count professors available on less common day", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          selectedDay: "TUESDAY",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        // Brown, Chen, Adams are available on Tuesday
        expect(result).toEqual({
          B: 1, // Brown
          C: 1, // Chen
          A: 1, // Adams
        });
      });

      it("should return empty when no professors available", () => {
        // Remove all professors from Saturday
        const options: CountOptions = {
          ...defaultCountOptions,
          selectedDay: "SATURDAY",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        expect(result).toEqual({});
      });

      it("should count all when day is ALL", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          selectedDay: "ALL",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        expect(Object.values(result).reduce((a, b) => a + b, 0)).toBe(7); // All professors
      });
    });

    describe("combined filters", () => {
      it("should apply multiple filters correctly", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          selectedCampus: "SKYLINE",
          selectedDepartment: "MATH",
          selectedDay: "FRIDAY",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        // Only Anderson meets all criteria (SKYLINE + MATH + available Friday)
        expect(result).toEqual({
          A: 1, // Anderson
        });
      });

      it("should return empty when no professors match all filters", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          selectedCampus: "CANADA",
          selectedDepartment: "MATH",
          selectedDay: "SATURDAY",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        expect(result).toEqual({});
      });

      it("should handle complex combination with search term", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          selectedCampus: "SKYLINE",
          searchTerm: "PHYS",
          selectedDay: "TUESDAY",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        // Adams is SKYLINE + has PHYS + available Tuesday
        expect(result).toEqual({
          A: 1, // Adams
        });
      });
    });

    describe("edge cases", () => {
      it("should handle empty doorcards array", () => {
        const result = calculateProfessorCounts([], defaultCountOptions);

        expect(result).toEqual({});
      });

      it("should handle doorcards without user", () => {
        const doorcards = [{ ...mockDoorcards[0], user: null }];

        const options: CountOptions = {
          ...defaultCountOptions,
          searchTerm: "test",
        };

        const result = calculateProfessorCounts(doorcards, options);

        expect(result).toEqual({});
      });

      it("should handle doorcards without availableDays", () => {
        const doorcards = [{ ...mockDoorcards[0], availableDays: null }];

        const options: CountOptions = {
          ...defaultCountOptions,
          selectedDay: "MONDAY",
        };

        const result = calculateProfessorCounts(doorcards, options);

        expect(result).toEqual({});
      });

      it("should handle malformed names gracefully", () => {
        const doorcards = [
          { ...mockDoorcards[0], name: "" },
          { ...mockDoorcards[1], name: "   " },
          { ...mockDoorcards[2], name: "ValidName" },
        ];

        const result = calculateProfessorCounts(doorcards, defaultCountOptions);

        expect(result).toEqual({
          V: 1, // ValidName
        });
      });

      it("should handle names with only numbers or special characters", () => {
        const doorcards = [
          { ...mockDoorcards[0], name: "123 456" },
          { ...mockDoorcards[1], name: "@#$ %^&" },
          { ...mockDoorcards[2], name: "Smith, John" },
        ];

        const result = calculateProfessorCounts(doorcards, defaultCountOptions);

        expect(result).toEqual({
          S: 1, // Only Smith counted
        });
      });

      it("should handle single names correctly", () => {
        const doorcards = [
          { ...mockDoorcards[0], name: "Madonna" },
          { ...mockDoorcards[1], name: "Cher" },
        ];

        const result = calculateProfessorCounts(doorcards, defaultCountOptions);

        expect(result).toEqual({
          M: 1, // Madonna
          C: 1, // Cher
        });
      });

      it("should increment counts for professors with same first letter", () => {
        const doorcards = [
          { ...mockDoorcards[0], name: "Smith, John" },
          { ...mockDoorcards[1], name: "Stevens, Sarah" },
          { ...mockDoorcards[2], name: "Stone, Michael" },
        ];

        const result = calculateProfessorCounts(doorcards, defaultCountOptions);

        expect(result).toEqual({
          S: 3, // All three S names
        });
      });
    });

    describe("real-world scenarios", () => {
      it("should handle typical professor directory filtering", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          selectedCampus: "SKYLINE",
          showCurrentTermOnly: true,
          activeTerm: mockActiveTerm,
          termLoading: false,
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        // SKYLINE professors in FALL 2024: Anderson, Adams
        expect(result).toEqual({
          A: 2, // Anderson, Adams
        });
      });

      it("should handle department-specific counting with search", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          selectedDepartment: "MATH",
          searchTerm: "statistics",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        // Only Evans matches both MATH department and statistics search
        expect(result).toEqual({
          E: 1, // Evans
        });
      });

      it("should handle availability-based filtering", () => {
        const options: CountOptions = {
          ...defaultCountOptions,
          selectedDay: "WEDNESDAY",
          selectedCampus: "SKYLINE",
        };

        const result = calculateProfessorCounts(mockDoorcards, options);

        // SKYLINE professors available Wednesday: Anderson, Davis
        expect(result).toEqual({
          A: 1, // Anderson
          D: 1, // Davis
        });
      });
    });
  });
});
