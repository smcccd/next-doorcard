import type { DisplayNameFormat } from "@prisma/client";

/**
 * Simple user profile for deriving display names.
 * Used by server actions when creating/updating doorcards.
 */
export interface UserProfile {
  firstName?: string | null;
  lastName?: string | null;
  title?: string | null;
  name?: string | null;
  email?: string | null;
}

/**
 * Derives a display name from user profile data.
 * This is a simpler version for server-side use that doesn't use the format system.
 *
 * Priority:
 * 1. Title + FirstName + LastName (if title exists and isn't "none")
 * 2. FirstName + LastName
 * 3. Legacy name field
 * 4. Email username
 * 5. "Faculty Member" fallback
 *
 * @param profile - User profile data
 * @returns The derived display name
 */
export function deriveDisplayName(profile: UserProfile): string {
  if (profile.firstName && profile.lastName) {
    if (profile.title && profile.title !== "none") {
      return `${profile.title} ${profile.firstName} ${profile.lastName}`;
    }
    return `${profile.firstName} ${profile.lastName}`;
  }

  if (profile.name) {
    return profile.name;
  }

  if (profile.email) {
    return profile.email.split("@")[0] || "Faculty Member";
  }

  return "Faculty Member";
}

export interface UserDisplayInfo {
  firstName?: string | null;
  lastName?: string | null;
  title?: string | null;
  pronouns?: string | null;
  displayFormat?: DisplayNameFormat | null;
  name?: string | null; // fallback for legacy data
}

export function formatDisplayName(user: UserDisplayInfo): string {
  // If we have firstName and lastName, use the new format system
  if (user.firstName && user.lastName) {
    const format = user.displayFormat || "FULL_NAME";
    let displayName = "";

    // Check if the format requires a title but none is available
    const titleFormats = [
      "FULL_WITH_TITLE",
      "LAST_WITH_TITLE",
      "FIRST_INITIAL_LAST_WITH_TITLE",
    ];
    const hasTitle = user.title && user.title.trim() !== "";

    if (titleFormats.includes(format) && !hasTitle) {
      // Fall back to equivalent format without title
      switch (format) {
        case "FULL_WITH_TITLE":
          displayName = `${user.firstName} ${user.lastName}`;
          break;
        case "LAST_WITH_TITLE":
          displayName = user.lastName;
          break;
        case "FIRST_INITIAL_LAST_WITH_TITLE":
          displayName = `${user.firstName.charAt(0).toUpperCase()} ${user.lastName}`;
          break;
      }
    } else {
      switch (format) {
        case "FULL_WITH_TITLE":
          displayName = user.title
            ? `${user.title} ${user.firstName} ${user.lastName}`
            : `${user.firstName} ${user.lastName}`;
          break;

        case "LAST_WITH_TITLE":
          displayName = user.title
            ? `${user.title} ${user.lastName}`
            : user.lastName;
          break;

        case "FIRST_INITIAL_LAST_WITH_TITLE":
          const initial = user.firstName.charAt(0).toUpperCase();
          displayName = user.title
            ? `${user.title} ${initial} ${user.lastName}`
            : `${initial} ${user.lastName}`;
          break;

        case "FIRST_INITIAL_LAST":
          const firstInitial = user.firstName.charAt(0).toUpperCase();
          displayName = `${firstInitial} ${user.lastName}`;
          break;

        case "FULL_NAME":
        default:
          displayName = `${user.firstName} ${user.lastName}`;
          break;
      }
    }

    // Add pronouns if available
    if (user.pronouns && user.pronouns.trim() !== "") {
      displayName += ` (${user.pronouns})`;
    }

    return displayName;
  }

  // Fallback to legacy name field
  return user.name || "Faculty Member";
}

export function getDisplayFormatOptions(
  firstName: string,
  lastName: string,
  title?: string | null,
  pronouns?: string | null
) {
  const hasTitle = title && title !== "none";
  const hasPronouns = pronouns && pronouns !== "none";

  // Use the provided names for preview, or fallback to Bryan/Besnyi
  const previewFirst = firstName || "Bryan";
  const previewLast = lastName || "Besnyi";
  const previewTitle = hasTitle ? title : "Dr.";
  const previewPronouns = hasPronouns ? pronouns : "they/them";

  const options = [];

  // Always include basic formats
  options.push({
    value: "FULL_NAME",
    label: hasPronouns ? "First Last (pronouns)" : "First Last",
    description: hasPronouns
      ? `${previewFirst} ${previewLast} (${previewPronouns})`
      : `${previewFirst} ${previewLast}`,
    requiresTitle: false,
    requiresPronouns: false,
  });

  options.push({
    value: "FIRST_INITIAL_LAST",
    label: hasPronouns ? "F. Last (pronouns)" : "F. Last",
    description: hasPronouns
      ? `${previewFirst.charAt(0)} ${previewLast} (${previewPronouns})`
      : `${previewFirst.charAt(0)} ${previewLast}`,
    requiresTitle: false,
    requiresPronouns: false,
  });

  // Include title-based formats only if user has a title
  if (hasTitle) {
    options.push({
      value: "FULL_WITH_TITLE",
      label: hasPronouns ? "Title First Last (pronouns)" : "Title First Last",
      description: hasPronouns
        ? `${previewTitle} ${previewFirst} ${previewLast} (${previewPronouns})`
        : `${previewTitle} ${previewFirst} ${previewLast}`,
      requiresTitle: true,
      requiresPronouns: false,
    });

    options.push({
      value: "LAST_WITH_TITLE",
      label: hasPronouns ? "Title Last (pronouns)" : "Title Last",
      description: hasPronouns
        ? `${previewTitle} ${previewLast} (${previewPronouns})`
        : `${previewTitle} ${previewLast}`,
      requiresTitle: true,
      requiresPronouns: false,
    });

    options.push({
      value: "FIRST_INITIAL_LAST_WITH_TITLE",
      label: hasPronouns ? "Title F. Last (pronouns)" : "Title F. Last",
      description: hasPronouns
        ? `${previewTitle} ${previewFirst.charAt(0)} ${previewLast} (${previewPronouns})`
        : `${previewTitle} ${previewFirst.charAt(0)} ${previewLast}`,
      requiresTitle: true,
      requiresPronouns: false,
    });
  }

  return options;
}

export const COLLEGE_OPTIONS = [
  { value: "SKYLINE", label: "Skyline College" },
  { value: "CSM", label: "College of San Mateo" },
  { value: "CANADA", label: "Cañada College" },
] as const;

/**
 * Converts a college enum value to its human-readable display name.
 * Used to ensure consistent branding across the application (e.g., "Cañada College" not "CANADA").
 *
 * @param college - The college enum value (e.g., "CANADA", "CSM", "SKYLINE")
 * @returns The human-readable college name with proper formatting
 *
 * @example
 * getCollegeDisplayName("CANADA") // Returns "Cañada College"
 * getCollegeDisplayName("CSM") // Returns "College of San Mateo"
 */
export function getCollegeDisplayName(college: string): string {
  const option = COLLEGE_OPTIONS.find((opt) => opt.value === college);
  return option?.label || college;
}

export const ACADEMIC_TITLES = [
  "Dr.",
  "Prof.",
  "Professor",
  "Assistant Professor",
  "Associate Professor",
  "Full Professor",
  "Emeritus Professor",
  "Adjunct Professor",
  "Lecturer",
  "Senior Lecturer",
  "Instructor",
] as const;

export const COMMON_PRONOUNS = [
  "she/her",
  "he/him",
  "they/them",
  "she/they",
  "he/they",
  "any pronouns",
] as const;
