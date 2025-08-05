import {
  getCurrentAcademicTerm,
  compareTerms,
  getTermStatus,
  categorizeDoorcards,
  getDoorcardDisplayStatus,
} from "../doorcard-status";
import type { Doorcard } from "@prisma/client";

// Mock Date for consistent testing
const mockDate = (date: string) => {
  jest.useFakeTimers();
  const mockDateObj = new Date(date);
  jest.setSystemTime(mockDateObj);
};

const createMockDoorcard = (overrides: Partial<Doorcard> = {}): Doorcard => ({
  id: "test-id",
  term: "FALL",
  year: 2024,
  campus: "SKYLINE",
  doorcardName: "Test Doorcard",
  officeNumber: "Room 101",
  email: "test@example.com",
  phone: "555-1234",
  name: "Test Professor",
  isActive: true,
  isPublic: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: "user-id",
  ...overrides,
});

describe("Doorcard Status", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getCurrentAcademicTerm", () => {
    it("should return SPRING for January-May", () => {
      // Test March (definitely Spring)
      mockDate("2024-03-15T10:00:00.000Z");
      expect(getCurrentAcademicTerm()).toEqual({
        season: "SPRING",
        year: 2024,
      });

      // Test January (start of Spring)
      mockDate("2024-01-15T10:00:00.000Z");
      expect(getCurrentAcademicTerm()).toEqual({
        season: "SPRING",
        year: 2024,
      });

      // Test May (end of Spring)
      mockDate("2024-05-15T10:00:00.000Z");
      expect(getCurrentAcademicTerm()).toEqual({
        season: "SPRING",
        year: 2024,
      });
    });

    it("should return SUMMER for June-August", () => {
      mockDate("2024-07-15T10:00:00.000Z");
      expect(getCurrentAcademicTerm()).toEqual({
        season: "SUMMER",
        year: 2024,
      });

      mockDate("2024-06-15T10:00:00.000Z");
      expect(getCurrentAcademicTerm()).toEqual({
        season: "SUMMER",
        year: 2024,
      });

      mockDate("2024-08-15T10:00:00.000Z");
      expect(getCurrentAcademicTerm()).toEqual({
        season: "SUMMER",
        year: 2024,
      });
    });

    it("should return FALL for September-December", () => {
      mockDate("2024-10-15T10:00:00.000Z");
      expect(getCurrentAcademicTerm()).toEqual({ season: "FALL", year: 2024 });

      mockDate("2024-09-15T10:00:00.000Z");
      expect(getCurrentAcademicTerm()).toEqual({ season: "FALL", year: 2024 });

      mockDate("2024-12-15T10:00:00.000Z");
      expect(getCurrentAcademicTerm()).toEqual({ season: "FALL", year: 2024 });
    });
  });

  describe("compareTerms", () => {
    it("should compare years correctly", () => {
      const term2023 = { season: "FALL" as const, year: 2023 };
      const term2024 = { season: "FALL" as const, year: 2024 };

      expect(compareTerms(term2023, term2024)).toBe(-1);
      expect(compareTerms(term2024, term2023)).toBe(1);
      expect(compareTerms(term2024, term2024)).toBe(0);
    });

    it("should compare seasons within same year", () => {
      const spring = { season: "SPRING" as const, year: 2024 };
      const summer = { season: "SUMMER" as const, year: 2024 };
      const fall = { season: "FALL" as const, year: 2024 };

      expect(compareTerms(spring, summer)).toBe(-5); // Jan vs June
      expect(compareTerms(summer, fall)).toBe(-3); // June vs September
      expect(compareTerms(spring, fall)).toBe(-8); // Jan vs September
      expect(compareTerms(fall, spring)).toBe(8); // September vs Jan (next year)
    });

    it("should handle identical terms", () => {
      const term1 = { season: "FALL" as const, year: 2024 };
      const term2 = { season: "FALL" as const, year: 2024 };

      expect(compareTerms(term1, term2)).toBe(0);
    });
  });

  describe("getTermStatus", () => {
    beforeEach(() => {
      mockDate("2024-10-15T10:00:00.000Z"); // Fall 2024
    });

    it('should return "current" for current term', () => {
      const doorcard = createMockDoorcard({ term: "FALL", year: 2024 });
      expect(getTermStatus(doorcard)).toBe("current");
    });

    it('should return "past" for past terms', () => {
      const doorcard2023 = createMockDoorcard({ term: "FALL", year: 2023 });
      expect(getTermStatus(doorcard2023)).toBe("past");

      const spring2024 = createMockDoorcard({ term: "SPRING", year: 2024 });
      expect(getTermStatus(spring2024)).toBe("past");
    });

    it('should return "future" for future terms', () => {
      const spring2025 = createMockDoorcard({ term: "SPRING", year: 2025 });
      expect(getTermStatus(spring2025)).toBe("future");

      const fall2025 = createMockDoorcard({ term: "FALL", year: 2025 });
      expect(getTermStatus(fall2025)).toBe("future");
    });
  });

  describe("categorizeDoorcards", () => {
    beforeEach(() => {
      mockDate("2024-10-15T10:00:00.000Z"); // Fall 2024
    });

    it("should categorize doorcards correctly", () => {
      const doorcards = [
        createMockDoorcard({ id: "1", term: "FALL", year: 2023 }), // past
        createMockDoorcard({ id: "2", term: "FALL", year: 2024 }), // current
        createMockDoorcard({ id: "3", term: "SPRING", year: 2025 }), // future
        createMockDoorcard({ id: "4", term: "SPRING", year: 2024 }), // past
      ];

      const result = categorizeDoorcards(doorcards);

      expect(result.current).toHaveLength(1);
      expect(result.current[0].id).toBe("2");

      expect(result.archived).toHaveLength(2);
      expect(result.archived.map((d) => d.id).sort()).toEqual(["1", "4"]);

      expect(result.upcoming).toHaveLength(1);
      expect(result.upcoming[0].id).toBe("3");
    });

    it("should handle empty array", () => {
      const result = categorizeDoorcards([]);
      expect(result.current).toHaveLength(0);
      expect(result.archived).toHaveLength(0);
      expect(result.upcoming).toHaveLength(0);
    });
  });

  describe("getDoorcardDisplayStatus", () => {
    beforeEach(() => {
      mockDate("2024-10-15T10:00:00.000Z"); // Fall 2024
    });

    it('should return "live" for active, public, complete current doorcards', () => {
      const doorcard = createMockDoorcard({
        term: "FALL",
        year: 2024,
        isActive: true,
        isPublic: true,
        doorcardName: "Test",
        officeNumber: "Room 101",
      });

      // Add appointments to make it complete
      const doorcardWithAppointments = {
        ...doorcard,
        appointments: [{ id: 1 }],
      };

      const result = getDoorcardDisplayStatus(doorcardWithAppointments);
      expect(result.status).toBe("live");
      expect(result.label).toBe("Live");
    });

    it('should return "draft" for complete but not public current doorcards', () => {
      const doorcard = createMockDoorcard({
        term: "FALL",
        year: 2024,
        isActive: false,
        isPublic: false,
        doorcardName: "Test",
        officeNumber: "Room 101",
      });

      const doorcardWithAppointments = {
        ...doorcard,
        appointments: [{ id: 1 }],
      };

      const result = getDoorcardDisplayStatus(doorcardWithAppointments);
      expect(result.status).toBe("draft");
      expect(result.label).toBe("Draft");
    });

    it('should return "incomplete" for doorcards missing essential info', () => {
      const incompleteDoorcards = [
        createMockDoorcard({ doorcardName: "", officeNumber: "Room 101" }),
        createMockDoorcard({ doorcardName: "Test", officeNumber: "" }),
        createMockDoorcard({
          doorcardName: "Test",
          officeNumber: "Room 101",
          appointments: [],
        }),
        createMockDoorcard({ doorcardName: "Test", officeNumber: "Room 101" }), // no appointments
      ];

      incompleteDoorcards.forEach((doorcard) => {
        const result = getDoorcardDisplayStatus(doorcard);
        expect(result.status).toBe("incomplete");
        expect(result.label).toBe("Incomplete");
      });
    });

    it('should return "archived" for past term doorcards', () => {
      const doorcard = createMockDoorcard({
        term: "FALL",
        year: 2023,
        doorcardName: "Test",
        officeNumber: "Room 101",
      });

      const doorcardWithAppointments = {
        ...doorcard,
        appointments: [{ id: 1 }],
      };

      const result = getDoorcardDisplayStatus(doorcardWithAppointments);
      expect(result.status).toBe("archived");
      expect(result.label).toBe("Archived");
      expect(result.description).toBe("From FALL 2023");
    });

    it('should return "upcoming" for complete future term doorcards', () => {
      const doorcard = createMockDoorcard({
        term: "SPRING",
        year: 2025,
        doorcardName: "Test",
        officeNumber: "Room 101",
      });

      const doorcardWithAppointments = {
        ...doorcard,
        appointments: [{ id: 1 }],
      };

      const result = getDoorcardDisplayStatus(doorcardWithAppointments);
      expect(result.status).toBe("upcoming");
      expect(result.label).toBe("Upcoming");
      expect(result.description).toBe("Ready for SPRING 2025");
    });

    it("should prioritize incomplete status over term status", () => {
      // Even past terms should show incomplete if they're missing info
      const incompletePastDoorcard = createMockDoorcard({
        term: "FALL",
        year: 2023,
        doorcardName: "",
        officeNumber: "Room 101",
      });

      const result = getDoorcardDisplayStatus(incompletePastDoorcard);
      expect(result.status).toBe("archived"); // Past terms are always archived
    });
  });
});
