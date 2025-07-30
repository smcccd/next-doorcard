import { DayOfWeek, TermSeason } from "@prisma/client";
import { PublicDoorcard } from "@/types/pages/public";
import { College } from "@/types/doorcard";
import { calculateProfessorCounts, CountOptions } from "../professor-counts";

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

describe("Professor Counts Utils", () => {
  const mockDoorcards: PublicDoorcard[] = [
    {
      id: "1",
      name: "Dr. Adams, John",
      doorcardName: "John Adams - Mathematics",
      college: "SKYLINE",
      term: "FALL",
      year: 2024,
      appointmentCount: 5,
      availableDays: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
      user: { name: "Dr. John Adams", username: "jadams" },
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
    {
      id: "2",
      name: "Prof. Brown, Jane",
      doorcardName: "Jane Brown - Computer Science",
      college: "CSM",
      term: "FALL",
      year: 2024,
      appointmentCount: 8,
      availableDays: [DayOfWeek.TUESDAY, DayOfWeek.THURSDAY],
      user: { name: "Prof. Jane Brown", username: "jbrown" },
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
    {
      id: "3",
      name: "Dr. Carter, Bob",
      doorcardName: "Bob Carter - English Literature",
      college: "CANADA",
      term: "SPRING",
      year: 2024,
      appointmentCount: 3,
      availableDays: [DayOfWeek.MONDAY, DayOfWeek.FRIDAY],
      user: { name: "Dr. Bob Carter", username: "bcarter" },
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
    {
      id: "4",
      name: "Alice Davis",
      doorcardName: "Alice Davis - Advanced Math",
      college: "SKYLINE",
      term: "FALL",
      year: 2024,
      appointmentCount: 10,
      availableDays: [DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
      user: { name: "Alice Davis", username: "adavis" },
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
    {
      id: "5",
      name: "Evans, Michael",
      doorcardName: "Michael Evans - Physics",
      college: "CSM",
      term: "FALL",
      year: 2024,
      appointmentCount: 6,
      availableDays: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY],
      user: { name: "Michael Evans", username: "mevans" },
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
  ];

  const defaultOptions: CountOptions = {
    selectedCampus: "ALL",
    selectedDepartment: "ALL",
    selectedDay: "ALL",
    searchTerm: "",
    showCurrentTermOnly: false,
    activeTerm: null,
    termLoading: false,
  };

  describe("calculateProfessorCounts", () => {
    it("should count professors by first letter of last name", () => {
      const result = calculateProfessorCounts(mockDoorcards, defaultOptions);

      expect(result["A"]).toBe(1); // Adams
      expect(result["B"]).toBe(1); // Brown
      expect(result["C"]).toBe(1); // Carter
      expect(result["D"]).toBe(1); // Davis
      expect(result["E"]).toBe(1); // Evans
    });

    it("should handle comma-separated names correctly", () => {
      const result = calculateProfessorCounts(mockDoorcards, defaultOptions);

      // "Dr. Adams, John" should count as "A" for Adams
      // "Evans, Michael" should count as "E" for Evans
      expect(result["A"]).toBe(1);
      expect(result["E"]).toBe(1);
    });

    it("should handle space-separated names correctly", () => {
      const result = calculateProfessorCounts(mockDoorcards, defaultOptions);

      // "Alice Davis" should count as "D" for Davis (last name)
      expect(result["D"]).toBe(1);
    });

    it("should filter by campus", () => {
      const options = {
        ...defaultOptions,
        selectedCampus: "SKYLINE" as College,
      };
      const result = calculateProfessorCounts(mockDoorcards, options);

      expect(result["A"]).toBe(1); // Adams at SKYLINE
      expect(result["D"]).toBe(1); // Davis at SKYLINE
      expect(result["B"]).toBeUndefined(); // Brown at CSM
      expect(result["E"]).toBeUndefined(); // Evans at CSM
    });

    it("should filter by department", () => {
      const options = { ...defaultOptions, selectedDepartment: "MATH" };
      const result = calculateProfessorCounts(mockDoorcards, options);

      expect(result["A"]).toBe(1); // Adams - Mathematics
      expect(result["D"]).toBe(1); // Davis - Advanced Math
      expect(result["B"]).toBeUndefined(); // Brown - Computer Science
    });

    it("should filter by search term", () => {
      const options = { ...defaultOptions, searchTerm: "john" };
      const result = calculateProfessorCounts(mockDoorcards, options);

      expect(result["A"]).toBe(1); // John Adams
      expect(Object.keys(result)).toHaveLength(1);
    });

    it("should filter by available day", () => {
      const options = { ...defaultOptions, selectedDay: DayOfWeek.MONDAY };
      const result = calculateProfessorCounts(mockDoorcards, options);

      expect(result["A"]).toBe(1); // Adams available Monday
      expect(result["C"]).toBe(1); // Carter available Monday
      expect(result["E"]).toBe(1); // Evans available Monday
      expect(result["B"]).toBeUndefined(); // Brown not available Monday
    });

    it("should filter by current term", () => {
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

      const result = calculateProfessorCounts(mockDoorcards, options);

      expect(result["A"]).toBe(1); // Adams Fall 2024
      expect(result["B"]).toBe(1); // Brown Fall 2024
      expect(result["D"]).toBe(1); // Davis Fall 2024
      expect(result["E"]).toBe(1); // Evans Fall 2024
      expect(result["C"]).toBeUndefined(); // Carter Spring 2024
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

      const result = calculateProfessorCounts(mockDoorcards, options);

      // Should include all professors since term is still loading
      expect(result["A"]).toBe(1);
      expect(result["B"]).toBe(1);
      expect(result["C"]).toBe(1);
      expect(result["D"]).toBe(1);
      expect(result["E"]).toBe(1);
    });

    it("should handle multiple filters", () => {
      const options = {
        ...defaultOptions,
        selectedCampus: "SKYLINE" as College,
        selectedDepartment: "MATH",
      };

      const result = calculateProfessorCounts(mockDoorcards, options);

      expect(result["A"]).toBe(1); // Adams at SKYLINE with Math
      expect(result["D"]).toBe(1); // Davis at SKYLINE with Math
      expect(Object.keys(result)).toHaveLength(2);
    });

    it("should return empty object when no professors match filters", () => {
      const options = {
        ...defaultOptions,
        searchTerm: "nonexistent",
      };

      const result = calculateProfessorCounts(mockDoorcards, options);

      expect(Object.keys(result)).toHaveLength(0);
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

      const result = calculateProfessorCounts(mockDoorcards, options);

      expect(result["A"]).toBe(1);
      expect(result["B"]).toBe(1);
      expect(result["D"]).toBe(1);
      expect(result["E"]).toBe(1);
      expect(result["C"]).toBeUndefined(); // Carter Spring 2024
    });

    it("should only count letters A-Z", () => {
      const specialDoorcards = [
        ...mockDoorcards,
        {
          id: "6",
          name: "123 Numeric",
          doorcardName: "Numeric Name",
          college: "SKYLINE",
          term: "FALL",
          year: 2024,
          appointmentCount: 1,
          availableDays: [DayOfWeek.MONDAY],
          user: { name: "123 Numeric", username: "numeric" },
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        },
      ] as PublicDoorcard[];

      const result = calculateProfessorCounts(specialDoorcards, defaultOptions);

      // Should not include the numeric name
      expect(result["1"]).toBeUndefined();
      expect(result["123"]).toBeUndefined();

      // Should still have the regular names
      expect(result["A"]).toBe(1);
      expect(result["B"]).toBe(1);
    });

    it("should handle empty last names gracefully", () => {
      const edgeCaseDoorcards = [
        {
          id: "7",
          name: "", // Empty name
          doorcardName: "Empty Name",
          college: "SKYLINE",
          term: "FALL",
          year: 2024,
          appointmentCount: 1,
          availableDays: [DayOfWeek.MONDAY],
          user: { name: "", username: "empty" },
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        },
        {
          id: "8",
          name: "SingleName", // No space or comma
          doorcardName: "Single Name",
          college: "SKYLINE",
          term: "FALL",
          year: 2024,
          appointmentCount: 1,
          availableDays: [DayOfWeek.MONDAY],
          user: { name: "SingleName", username: "single" },
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        },
      ] as PublicDoorcard[];

      const result = calculateProfessorCounts(
        edgeCaseDoorcards,
        defaultOptions
      );

      expect(result["S"]).toBe(1); // SingleName
      // Empty name should not contribute to counts
    });
  });
});
