import { TermSeason } from "@prisma/client";
import {
  getCurrentAcademicTerm,
  formatTermDisplay,
  isCurrentTerm,
  isUpcomingTerm,
  isPastTerm,
} from "../active-term";

// Mock Date for consistent testing
const mockDate = (year: number, month: number, day: number = 15) => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(year, month - 1, day));
};

describe("Active Term Utils", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("getCurrentAcademicTerm", () => {
    it("should return SPRING for January to May", () => {
      mockDate(2024, 1); // January
      let result = getCurrentAcademicTerm();
      expect(result.season).toBe(TermSeason.SPRING);
      expect(result.year).toBe(2024);
      expect(result.displayName).toBe("Spring 2024");
      expect(result.isFromDatabase).toBe(false);

      mockDate(2024, 3); // March
      result = getCurrentAcademicTerm();
      expect(result.season).toBe(TermSeason.SPRING);
      expect(result.year).toBe(2024);

      mockDate(2024, 5); // May
      result = getCurrentAcademicTerm();
      expect(result.season).toBe(TermSeason.SPRING);
      expect(result.year).toBe(2024);
    });

    it("should return SUMMER for June to August", () => {
      mockDate(2024, 6); // June
      let result = getCurrentAcademicTerm();
      expect(result.season).toBe(TermSeason.SUMMER);
      expect(result.year).toBe(2024);
      expect(result.displayName).toBe("Summer 2024");

      mockDate(2024, 7); // July
      result = getCurrentAcademicTerm();
      expect(result.season).toBe(TermSeason.SUMMER);

      mockDate(2024, 8); // August
      result = getCurrentAcademicTerm();
      expect(result.season).toBe(TermSeason.SUMMER);
    });

    it("should return FALL for September to December", () => {
      mockDate(2024, 9); // September
      let result = getCurrentAcademicTerm();
      expect(result.season).toBe(TermSeason.FALL);
      expect(result.year).toBe(2024);
      expect(result.displayName).toBe("Fall 2024");

      mockDate(2024, 10); // October
      result = getCurrentAcademicTerm();
      expect(result.season).toBe(TermSeason.FALL);

      mockDate(2024, 12); // December
      result = getCurrentAcademicTerm();
      expect(result.season).toBe(TermSeason.FALL);
    });
  });

  describe("formatTermDisplay", () => {
    it("should format term display correctly", () => {
      expect(formatTermDisplay(TermSeason.SPRING, 2024)).toBe("Spring 2024");
      expect(formatTermDisplay(TermSeason.SUMMER, 2024)).toBe("Summer 2024");
      expect(formatTermDisplay(TermSeason.FALL, 2024)).toBe("Fall 2024");
    });

    it("should handle different years", () => {
      expect(formatTermDisplay(TermSeason.SPRING, 2023)).toBe("Spring 2023");
      expect(formatTermDisplay(TermSeason.FALL, 2025)).toBe("Fall 2025");
    });
  });

  describe("isCurrentTerm", () => {
    beforeEach(() => {
      mockDate(2024, 3); // March 2024 = Spring 2024
    });

    it("should return true for current term", () => {
      expect(isCurrentTerm(TermSeason.SPRING, 2024)).toBe(true);
    });

    it("should return false for different season in same year", () => {
      expect(isCurrentTerm(TermSeason.SUMMER, 2024)).toBe(false);
      expect(isCurrentTerm(TermSeason.FALL, 2024)).toBe(false);
    });

    it("should return false for same season in different year", () => {
      expect(isCurrentTerm(TermSeason.SPRING, 2023)).toBe(false);
      expect(isCurrentTerm(TermSeason.SPRING, 2025)).toBe(false);
    });
  });

  describe("isUpcomingTerm", () => {
    beforeEach(() => {
      mockDate(2024, 3); // March 2024 = Spring 2024
    });

    it("should return true for future years", () => {
      expect(isUpcomingTerm(TermSeason.SPRING, 2025)).toBe(true);
      expect(isUpcomingTerm(TermSeason.SUMMER, 2025)).toBe(true);
      expect(isUpcomingTerm(TermSeason.FALL, 2025)).toBe(true);
    });

    it("should return false for past years", () => {
      expect(isUpcomingTerm(TermSeason.SPRING, 2023)).toBe(false);
      expect(isUpcomingTerm(TermSeason.SUMMER, 2023)).toBe(false);
      expect(isUpcomingTerm(TermSeason.FALL, 2023)).toBe(false);
    });

    it("should return true for later seasons in same year", () => {
      // Current is Spring 2024
      expect(isUpcomingTerm(TermSeason.SUMMER, 2024)).toBe(true);
      expect(isUpcomingTerm(TermSeason.FALL, 2024)).toBe(true);
    });

    it("should return false for current season", () => {
      expect(isUpcomingTerm(TermSeason.SPRING, 2024)).toBe(false);
    });

    it("should return false for earlier seasons in same year", () => {
      // Spring comes before Summer/Fall, so no earlier seasons exist
      // Test from Summer perspective
      mockDate(2024, 7); // July 2024 = Summer 2024
      expect(isUpcomingTerm(TermSeason.SPRING, 2024)).toBe(false);

      // Test from Fall perspective
      mockDate(2024, 10); // October 2024 = Fall 2024
      expect(isUpcomingTerm(TermSeason.SPRING, 2024)).toBe(false);
      expect(isUpcomingTerm(TermSeason.SUMMER, 2024)).toBe(false);
    });
  });

  describe("isPastTerm", () => {
    beforeEach(() => {
      mockDate(2024, 7); // July 2024 = Summer 2024
    });

    it("should return true for past years", () => {
      expect(isPastTerm(TermSeason.SPRING, 2023)).toBe(true);
      expect(isPastTerm(TermSeason.SUMMER, 2023)).toBe(true);
      expect(isPastTerm(TermSeason.FALL, 2023)).toBe(true);
    });

    it("should return false for future years", () => {
      expect(isPastTerm(TermSeason.SPRING, 2025)).toBe(false);
      expect(isPastTerm(TermSeason.SUMMER, 2025)).toBe(false);
      expect(isPastTerm(TermSeason.FALL, 2025)).toBe(false);
    });

    it("should return true for earlier seasons in same year", () => {
      // Current is Summer 2024
      expect(isPastTerm(TermSeason.SPRING, 2024)).toBe(true);
    });

    it("should return false for current season", () => {
      expect(isPastTerm(TermSeason.SUMMER, 2024)).toBe(false);
    });

    it("should return false for later seasons in same year", () => {
      // Current is Summer 2024
      expect(isPastTerm(TermSeason.FALL, 2024)).toBe(false);
    });
  });

  describe("season order logic", () => {
    it("should handle season transitions correctly", () => {
      // Test Spring to Summer transition
      mockDate(2024, 3); // Spring 2024
      expect(isUpcomingTerm(TermSeason.SUMMER, 2024)).toBe(true);
      expect(isPastTerm(TermSeason.SUMMER, 2024)).toBe(false);

      // Test Summer to Fall transition
      mockDate(2024, 7); // Summer 2024
      expect(isUpcomingTerm(TermSeason.FALL, 2024)).toBe(true);
      expect(isPastTerm(TermSeason.SPRING, 2024)).toBe(true);

      // Test Fall to next Spring transition
      mockDate(2024, 10); // Fall 2024
      expect(isUpcomingTerm(TermSeason.SPRING, 2025)).toBe(true);
      expect(isPastTerm(TermSeason.SPRING, 2024)).toBe(true);
      expect(isPastTerm(TermSeason.SUMMER, 2024)).toBe(true);
    });
  });
});
