import {
  formatDisplayName,
  getDisplayFormatOptions,
  COLLEGE_OPTIONS,
  ACADEMIC_TITLES,
  COMMON_PRONOUNS,
} from "../display-name";
import type { DisplayNameFormat } from "@prisma/client";

describe("Display Name Utils", () => {
  describe("formatDisplayName", () => {
    const baseUser = {
      firstName: "Bryan",
      lastName: "Besnyi",
      title: "Dr.",
      pronouns: "they/them",
    };

    it("should format FULL_NAME correctly", () => {
      const user = {
        ...baseUser,
        displayFormat: "FULL_NAME" as DisplayNameFormat,
      };
      expect(formatDisplayName(user)).toBe("Bryan Besnyi (they/them)");
    });

    it("should format FULL_NAME without pronouns", () => {
      const user = {
        ...baseUser,
        displayFormat: "FULL_NAME" as DisplayNameFormat,
        pronouns: null,
      };
      expect(formatDisplayName(user)).toBe("Bryan Besnyi");
    });

    it("should format FULL_WITH_TITLE correctly", () => {
      const user = {
        ...baseUser,
        displayFormat: "FULL_WITH_TITLE" as DisplayNameFormat,
      };
      expect(formatDisplayName(user)).toBe("Dr. Bryan Besnyi (they/them)");
    });

    it("should format LAST_WITH_TITLE correctly", () => {
      const user = {
        ...baseUser,
        displayFormat: "LAST_WITH_TITLE" as DisplayNameFormat,
      };
      expect(formatDisplayName(user)).toBe("Dr. Besnyi (they/them)");
    });

    it("should format FIRST_INITIAL_LAST correctly", () => {
      const user = {
        ...baseUser,
        displayFormat: "FIRST_INITIAL_LAST" as DisplayNameFormat,
      };
      expect(formatDisplayName(user)).toBe("B Besnyi (they/them)");
    });

    it("should format FIRST_INITIAL_LAST_WITH_TITLE correctly", () => {
      const user = {
        ...baseUser,
        displayFormat: "FIRST_INITIAL_LAST_WITH_TITLE" as DisplayNameFormat,
      };
      expect(formatDisplayName(user)).toBe("Dr. B Besnyi (they/them)");
    });

    it("should fallback when title required but not available", () => {
      const userNoTitle = {
        ...baseUser,
        title: null,
        displayFormat: "FULL_WITH_TITLE" as DisplayNameFormat,
      };
      expect(formatDisplayName(userNoTitle)).toBe("Bryan Besnyi (they/them)");

      const userEmptyTitle = {
        ...baseUser,
        title: "  ",
        displayFormat: "LAST_WITH_TITLE" as DisplayNameFormat,
      };
      expect(formatDisplayName(userEmptyTitle)).toBe("Besnyi (they/them)");

      const userInitialTitle = {
        ...baseUser,
        title: "",
        displayFormat: "FIRST_INITIAL_LAST_WITH_TITLE" as DisplayNameFormat,
      };
      expect(formatDisplayName(userInitialTitle)).toBe("B Besnyi (they/them)");
    });

    it("should handle missing format (default to FULL_NAME)", () => {
      const user = { ...baseUser, displayFormat: null };
      expect(formatDisplayName(user)).toBe("Bryan Besnyi (they/them)");
    });

    it("should handle empty pronouns", () => {
      const user = { ...baseUser, pronouns: "" };
      expect(formatDisplayName(user)).toBe("Bryan Besnyi");

      const userWhitespace = { ...baseUser, pronouns: "   " };
      expect(formatDisplayName(userWhitespace)).toBe("Bryan Besnyi");
    });

    it("should fallback to legacy name field", () => {
      const legacyUser = { name: "John Doe" };
      expect(formatDisplayName(legacyUser)).toBe("John Doe");
    });

    it("should handle missing firstName or lastName", () => {
      const noFirstName = { lastName: "Besnyi", firstName: null };
      expect(formatDisplayName(noFirstName)).toBe("Faculty Member");

      const noLastName = { firstName: "Bryan", lastName: null };
      expect(formatDisplayName(noLastName)).toBe("Faculty Member");
    });

    it("should return default when all fields missing", () => {
      expect(formatDisplayName({})).toBe("Faculty Member");
    });

    it("should handle special characters in names", () => {
      const user = {
        firstName: "José",
        lastName: "O'Connor",
        displayFormat: "FULL_NAME" as DisplayNameFormat,
      };
      expect(formatDisplayName(user)).toBe("José O'Connor");
    });
  });

  describe("getDisplayFormatOptions", () => {
    it("should return basic options without title or pronouns", () => {
      const options = getDisplayFormatOptions("Bryan", "Besnyi");

      expect(options).toHaveLength(2);
      expect(options[0]).toMatchObject({
        value: "FULL_NAME",
        label: "First Last",
        description: "Bryan Besnyi",
        requiresTitle: false,
        requiresPronouns: false,
      });
      expect(options[1]).toMatchObject({
        value: "FIRST_INITIAL_LAST",
        label: "F. Last",
        description: "B Besnyi",
        requiresTitle: false,
        requiresPronouns: false,
      });
    });

    it("should include title-based options when title provided", () => {
      const options = getDisplayFormatOptions("Bryan", "Besnyi", "Dr.");

      expect(options).toHaveLength(5);
      expect(options.map((o) => o.value)).toContain("FULL_WITH_TITLE");
      expect(options.map((o) => o.value)).toContain("LAST_WITH_TITLE");
      expect(options.map((o) => o.value)).toContain(
        "FIRST_INITIAL_LAST_WITH_TITLE"
      );
    });

    it("should include pronouns in labels and descriptions when provided", () => {
      const options = getDisplayFormatOptions(
        "Bryan",
        "Besnyi",
        "Dr.",
        "they/them"
      );

      expect(options[0]).toMatchObject({
        label: "First Last (pronouns)",
        description: "Bryan Besnyi (they/them)",
      });

      const titleOption = options.find((o) => o.value === "FULL_WITH_TITLE");
      expect(titleOption).toMatchObject({
        label: "Title First Last (pronouns)",
        description: "Dr. Bryan Besnyi (they/them)",
      });
    });

    it('should not include title options when title is "none"', () => {
      const options = getDisplayFormatOptions("Bryan", "Besnyi", "none");

      expect(options).toHaveLength(2);
      expect(options.map((o) => o.value)).not.toContain("FULL_WITH_TITLE");
    });

    it('should not include pronouns when pronouns is "none"', () => {
      const options = getDisplayFormatOptions("Bryan", "Besnyi", "Dr.", "none");

      expect(options[0]).toMatchObject({
        label: "First Last",
        description: "Bryan Besnyi",
      });
    });

    it("should use fallback names when empty strings provided", () => {
      const options = getDisplayFormatOptions("", "", "Dr.", "they/them");

      expect(options[0].description).toBe("Bryan Besnyi (they/them)");
    });

    it("should mark title requirements correctly", () => {
      const options = getDisplayFormatOptions("Bryan", "Besnyi", "Dr.");

      const basicOptions = options.filter((o) => !o.requiresTitle);
      const titleOptions = options.filter((o) => o.requiresTitle);

      expect(basicOptions).toHaveLength(2);
      expect(titleOptions).toHaveLength(3);
      expect(titleOptions.map((o) => o.value).sort()).toEqual([
        "FIRST_INITIAL_LAST_WITH_TITLE",
        "FULL_WITH_TITLE",
        "LAST_WITH_TITLE",
      ]);
    });
  });

  describe("Constants", () => {
    it("should have correct college options", () => {
      expect(COLLEGE_OPTIONS).toEqual([
        { value: "SKYLINE", label: "Skyline College" },
        { value: "CSM", label: "College of San Mateo" },
        { value: "CANADA", label: "Cañada College" },
      ]);
    });

    it("should have academic titles array", () => {
      expect(ACADEMIC_TITLES).toContain("Dr.");
      expect(ACADEMIC_TITLES).toContain("Professor");
      expect(ACADEMIC_TITLES).toContain("Assistant Professor");
      expect(ACADEMIC_TITLES.length).toBeGreaterThan(10);
    });

    it("should have common pronouns array", () => {
      expect(COMMON_PRONOUNS).toContain("she/her");
      expect(COMMON_PRONOUNS).toContain("he/him");
      expect(COMMON_PRONOUNS).toContain("they/them");
      expect(COMMON_PRONOUNS).toHaveLength(6);
    });

    it("should have all unique values in arrays", () => {
      const uniqueTitles = [...new Set(ACADEMIC_TITLES)];
      expect(uniqueTitles).toHaveLength(ACADEMIC_TITLES.length);

      const uniquePronouns = [...new Set(COMMON_PRONOUNS)];
      expect(uniquePronouns).toHaveLength(COMMON_PRONOUNS.length);

      const uniqueColleges = [...new Set(COLLEGE_OPTIONS.map((c) => c.value))];
      expect(uniqueColleges).toHaveLength(COLLEGE_OPTIONS.length);
    });
  });
});
