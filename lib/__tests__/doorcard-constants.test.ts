import {
  DAYS_FULL,
  DAYS_WEEKDAYS,
  DAY_ABBREVIATIONS,
  TIME_SLOTS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  extractCourseCode,
  getTimeInMinutes,
  formatTimeRange,
  getActivityStyle,
  convertToPST,
} from "../doorcard/doorcard-constants";

describe("Doorcard Constants", () => {
  describe("Day Arrays", () => {
    it("should have correct full days", () => {
      expect(DAYS_FULL).toEqual([
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ]);
      expect(DAYS_FULL).toHaveLength(7);
    });

    it("should have correct weekdays", () => {
      expect(DAYS_WEEKDAYS).toEqual([
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
      ]);
      expect(DAYS_WEEKDAYS).toHaveLength(5);
    });

    it("should have correct day abbreviations", () => {
      expect(DAY_ABBREVIATIONS).toEqual([
        "Mon",
        "Tues",
        "Wed",
        "Thurs",
        "Fri",
        "Sat",
        "Sun",
      ]);
      expect(DAY_ABBREVIATIONS).toHaveLength(7);
    });
  });

  describe("Time Slots", () => {
    it("should generate 30 time slots from 7AM to 10PM", () => {
      expect(TIME_SLOTS).toHaveLength(30);
      expect(TIME_SLOTS[0]).toEqual({
        value: "07:00",
        label: "7:00 AM",
        hour: 7,
        minute: 0,
      });
      expect(TIME_SLOTS[1]).toEqual({
        value: "07:30",
        label: "7:30 AM",
        hour: 7,
        minute: 30,
      });
      expect(TIME_SLOTS[29]).toEqual({
        value: "21:30",
        label: "9:30 PM",
        hour: 21,
        minute: 30,
      });
    });

    it("should handle noon correctly", () => {
      const noonSlot = TIME_SLOTS.find(
        (slot) => slot.hour === 12 && slot.minute === 0
      );
      expect(noonSlot?.label).toBe("12:00 PM");
    });

    it("should format all time slots correctly", () => {
      TIME_SLOTS.forEach((slot) => {
        expect(slot.value).toMatch(/^\d{2}:\d{2}$/);
        expect(slot.label).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
        expect(slot.hour).toBeGreaterThanOrEqual(7);
        expect(slot.hour).toBeLessThanOrEqual(21);
        expect([0, 30]).toContain(slot.minute);
      });
    });
  });

  describe("Categories", () => {
    it("should have matching color and label keys", () => {
      const colorKeys = Object.keys(CATEGORY_COLORS);
      const labelKeys = Object.keys(CATEGORY_LABELS);
      expect(colorKeys.sort()).toEqual(labelKeys.sort());
    });

    it("should have valid hex colors", () => {
      Object.values(CATEGORY_COLORS).forEach((color) => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it("should have non-empty labels", () => {
      Object.values(CATEGORY_LABELS).forEach((label) => {
        expect(label).toBeTruthy();
        expect(typeof label).toBe("string");
      });
    });
  });

  describe("extractCourseCode", () => {
    it("should extract course codes with delimiters", () => {
      expect(extractCourseCode("CS 101 - Introduction to Programming")).toBe(
        "CS 101"
      );
      expect(extractCourseCode("MATH 200A - Calculus")).toBe("MATH 200A");
    });

    it("should extract course codes with regex patterns", () => {
      expect(extractCourseCode("CS101 Advanced Topics")).toBe("CS101");
      expect(extractCourseCode("MATH 200A")).toBe("MATH 200A");
      expect(extractCourseCode("PHYS1234B")).toBe("PHYS1234B");
    });

    it("should handle special activity names", () => {
      expect(extractCourseCode("Office Hours")).toBe("Office Hours");
      expect(extractCourseCode("office hours")).toBe("Office Hours");
      expect(extractCourseCode("Lab Session")).toBe("Lab");
      expect(extractCourseCode("lab time")).toBe("Lab");
    });

    it("should truncate long activities", () => {
      const longActivity =
        "Very Long Activity Name That Exceeds Twelve Characters";
      expect(extractCourseCode(longActivity)).toBe("Very Long Ac");
      expect(extractCourseCode(longActivity)).toHaveLength(12);
    });

    it("should handle empty or short inputs", () => {
      expect(extractCourseCode("")).toBe("");
      expect(extractCourseCode("ABC")).toBe("ABC");
    });
  });

  describe("getTimeInMinutes", () => {
    it("should convert time strings to minutes", () => {
      expect(getTimeInMinutes("00:00")).toBe(0);
      expect(getTimeInMinutes("01:00")).toBe(60);
      expect(getTimeInMinutes("12:30")).toBe(750);
      expect(getTimeInMinutes("23:59")).toBe(1439);
    });

    it("should handle various time formats", () => {
      expect(getTimeInMinutes("09:15")).toBe(555);
      expect(getTimeInMinutes("18:45")).toBe(1125);
    });
  });

  describe("formatTimeRange", () => {
    it("should format time ranges correctly", () => {
      expect(formatTimeRange("09:00", "10:30")).toBe("9:00 AM - 10:30 AM");
      expect(formatTimeRange("14:15", "15:45")).toBe("2:15 PM - 3:45 PM");
      expect(formatTimeRange("12:00", "13:00")).toBe("12:00 PM - 1:00 PM");
    });

    it("should handle cross-period ranges", () => {
      expect(formatTimeRange("11:30", "12:30")).toBe("11:30 AM - 12:30 PM");
      expect(formatTimeRange("23:00", "23:59")).toBe("11:00 PM - 11:59 PM");
    });
  });

  describe("getActivityStyle", () => {
    it("should return correct styles for known activities", () => {
      expect(getActivityStyle("Office Hours")).toBe("bg-green-50");
      expect(getActivityStyle("Class")).toBe("bg-blue-50");
      expect(getActivityStyle("Lab Time")).toBe("bg-yellow-50");
      expect(getActivityStyle("TBA")).toBe("bg-gray-50");
    });

    it("should return default style for unknown activities", () => {
      expect(getActivityStyle("Unknown Activity")).toBe("bg-gray-50");
      expect(getActivityStyle("")).toBe("bg-gray-50");
      expect(getActivityStyle("Random Text")).toBe("bg-gray-50");
    });
  });

  describe("Re-exported convertToPST", () => {
    it("should work correctly via re-export", () => {
      expect(convertToPST("14:30")).toBe("2:30 PM");
      expect(convertToPST("09:00")).toBe("9:00 AM");
    });
  });
});
