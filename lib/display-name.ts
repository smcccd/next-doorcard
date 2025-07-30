import type { DisplayNameFormat } from "@prisma/client";

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
