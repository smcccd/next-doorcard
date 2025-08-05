/**
 * Integration tests for display name formatting
 * Tests the actual display name formatting logic with various scenarios
 */
import { formatDisplayName, type UserDisplayInfo } from "../display-name";

describe("Display Name Integration Tests", () => {
  describe("formatDisplayName", () => {
    describe("with firstName and lastName", () => {
      const baseUser: UserDisplayInfo = {
        firstName: "John",
        lastName: "Smith",
        title: "Dr.",
      };

      it("should format FULL_NAME correctly", () => {
        expect(
          formatDisplayName({ ...baseUser, displayFormat: "FULL_NAME" })
        ).toBe("John Smith");
      });

      it("should format FULL_WITH_TITLE correctly", () => {
        expect(
          formatDisplayName({ ...baseUser, displayFormat: "FULL_WITH_TITLE" })
        ).toBe("Dr. John Smith");
      });

      it("should format unsupported format as FULL_NAME (default)", () => {
        // @ts-expect-error - testing runtime behavior with invalid format
        expect(
          formatDisplayName({ ...baseUser, displayFormat: "LAST_FIRST" })
        ).toBe("John Smith");
      });

      it("should format LAST_WITH_TITLE correctly", () => {
        expect(
          formatDisplayName({ ...baseUser, displayFormat: "LAST_WITH_TITLE" })
        ).toBe("Dr. Smith");
      });

      it("should format FIRST_INITIAL_LAST correctly", () => {
        expect(
          formatDisplayName({
            ...baseUser,
            displayFormat: "FIRST_INITIAL_LAST",
          })
        ).toBe("J Smith");
      });

      it("should format FIRST_INITIAL_LAST_WITH_TITLE correctly", () => {
        expect(
          formatDisplayName({
            ...baseUser,
            displayFormat: "FIRST_INITIAL_LAST_WITH_TITLE",
          })
        ).toBe("Dr. J Smith");
      });

      it("should default to FULL_NAME when no format specified", () => {
        expect(
          formatDisplayName({ firstName: "John", lastName: "Smith" })
        ).toBe("John Smith");
      });
    });

    describe("fallback behavior when title is missing", () => {
      const userWithoutTitle: UserDisplayInfo = {
        firstName: "Jane",
        lastName: "Doe",
        title: null,
      };

      it("should fallback FULL_WITH_TITLE to FULL_NAME", () => {
        expect(
          formatDisplayName({
            ...userWithoutTitle,
            displayFormat: "FULL_WITH_TITLE",
          })
        ).toBe("Jane Doe");
      });

      it("should fallback LAST_WITH_TITLE to LAST_ONLY", () => {
        expect(
          formatDisplayName({
            ...userWithoutTitle,
            displayFormat: "LAST_WITH_TITLE",
          })
        ).toBe("Doe");
      });

      it("should fallback FIRST_INITIAL_LAST_WITH_TITLE to FIRST_INITIAL_LAST", () => {
        expect(
          formatDisplayName({
            ...userWithoutTitle,
            displayFormat: "FIRST_INITIAL_LAST_WITH_TITLE",
          })
        ).toBe("J Doe");
      });
    });

    describe("fallback behavior when title is empty string", () => {
      const userWithEmptyTitle: UserDisplayInfo = {
        firstName: "Alice",
        lastName: "Johnson",
        title: "   ", // whitespace only
      };

      it("should treat whitespace-only title as missing", () => {
        expect(
          formatDisplayName({
            ...userWithEmptyTitle,
            displayFormat: "FULL_WITH_TITLE",
          })
        ).toBe("Alice Johnson");
      });
    });

    describe("legacy name fallback", () => {
      it("should use name field when firstName/lastName are missing", () => {
        expect(formatDisplayName({ name: "Dr. Bob Wilson" })).toBe(
          "Dr. Bob Wilson"
        );
      });

      it("should prefer firstName/lastName over name when both exist", () => {
        expect(
          formatDisplayName({
            firstName: "John",
            lastName: "Smith",
            name: "Dr. Bob Wilson",
            displayFormat: "FULL_NAME",
          })
        ).toBe("John Smith");
      });
    });

    describe("edge cases", () => {
      it('should fallback to "Faculty Member" when firstName is empty', () => {
        expect(formatDisplayName({ firstName: "", lastName: "Smith" })).toBe(
          "Faculty Member"
        );
      });

      it('should fallback to "Faculty Member" when lastName is empty', () => {
        expect(formatDisplayName({ firstName: "John", lastName: "" })).toBe(
          "Faculty Member"
        );
      });

      it('should fallback to "Faculty Member" when firstName is null', () => {
        expect(formatDisplayName({ firstName: null, lastName: "Smith" })).toBe(
          "Faculty Member"
        );
      });

      it('should fallback to "Faculty Member" when lastName is null', () => {
        expect(formatDisplayName({ firstName: "John", lastName: null })).toBe(
          "Faculty Member"
        );
      });

      it('should fallback to "Faculty Member" for completely empty user object', () => {
        expect(formatDisplayName({})).toBe("Faculty Member");
      });

      it('should fallback to "Faculty Member" when name is null', () => {
        expect(formatDisplayName({ name: null })).toBe("Faculty Member");
      });

      it('should fallback to "Faculty Member" when name is empty', () => {
        expect(formatDisplayName({ name: "" })).toBe("Faculty Member");
      });
    });

    describe("first initial extraction", () => {
      it("should handle single character first names", () => {
        expect(
          formatDisplayName({
            firstName: "A",
            lastName: "Smith",
            displayFormat: "FIRST_INITIAL_LAST",
          })
        ).toBe("A Smith");
      });

      it("should capitalize first initial", () => {
        expect(
          formatDisplayName({
            firstName: "john",
            lastName: "Smith",
            displayFormat: "FIRST_INITIAL_LAST",
          })
        ).toBe("J Smith");
      });

      it("should handle non-alphabetic first characters", () => {
        expect(
          formatDisplayName({
            firstName: "1john",
            lastName: "Smith",
            displayFormat: "FIRST_INITIAL_LAST",
          })
        ).toBe("1 Smith");
      });
    });

    describe("real-world scenarios", () => {
      it("should format typical professor name with title", () => {
        const professor: UserDisplayInfo = {
          firstName: "Elizabeth",
          lastName: "Martinez",
          title: "Prof.",
          displayFormat: "FULL_WITH_TITLE",
        };
        expect(formatDisplayName(professor)).toBe("Prof. Elizabeth Martinez");
      });

      it("should format with title and initial for compact display", () => {
        const professor: UserDisplayInfo = {
          firstName: "Robert",
          lastName: "Chen",
          title: "Dr.",
          displayFormat: "FIRST_INITIAL_LAST_WITH_TITLE",
        };
        expect(formatDisplayName(professor)).toBe("Dr. R Chen");
      });

      it("should format without title for simple display", () => {
        const professor: UserDisplayInfo = {
          firstName: "Sarah",
          lastName: "Williams",
          displayFormat: "FIRST_INITIAL_LAST",
        };
        expect(formatDisplayName(professor)).toBe("S Williams");
      });

      it("should handle legacy data migration", () => {
        const legacyUser: UserDisplayInfo = {
          name: "Dr. Michael Thompson, PhD",
        };
        expect(formatDisplayName(legacyUser)).toBe("Dr. Michael Thompson, PhD");
      });

      it("should include pronouns when available", () => {
        const professor: UserDisplayInfo = {
          firstName: "Alex",
          lastName: "Jordan",
          pronouns: "they/them",
          displayFormat: "FULL_NAME",
        };
        expect(formatDisplayName(professor)).toBe("Alex Jordan (they/them)");
      });

      it("should include pronouns with title", () => {
        const professor: UserDisplayInfo = {
          firstName: "Chris",
          lastName: "Taylor",
          title: "Prof.",
          pronouns: "she/her",
          displayFormat: "FULL_WITH_TITLE",
        };
        expect(formatDisplayName(professor)).toBe(
          "Prof. Chris Taylor (she/her)"
        );
      });

      it("should ignore empty pronouns", () => {
        const professor: UserDisplayInfo = {
          firstName: "Sam",
          lastName: "Davis",
          pronouns: "   ",
          displayFormat: "FULL_NAME",
        };
        expect(formatDisplayName(professor)).toBe("Sam Davis");
      });
    });
  });
});
