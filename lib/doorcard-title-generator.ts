/**
 * Utility functions for generating automatic doorcard titles
 */

import type { TermSeason, College } from "@prisma/client";

export interface DoorcardTitleInfo {
  facultyName: string;
  term: TermSeason;
  year: number;
  college?: College;
}

/**
 * Generate automatic doorcard title following the convention:
 * "{Faculty Name} - {Term} {Year}"
 */
export function generateDoorcardTitle({
  facultyName,
  term,
  year,
}: DoorcardTitleInfo): string {
  const termName = formatTermName(term);
  return `${facultyName} - ${termName} ${year}`;
}

/**
 * Format term name for display
 */
export function formatTermName(term: TermSeason): string {
  switch (term) {
    case "FALL":
      return "Fall";
    case "SPRING":
      return "Spring";
    case "SUMMER":
      return "Summer";
    default:
      return term;
  }
}

/**
 * Generate slug from doorcard title
 */
export function generateDoorcardSlug({
  facultyName,
  term,
  year,
}: DoorcardTitleInfo): string {
  const baseSlug = `${facultyName}-${formatTermName(term)}-${year}`;
  return baseSlug
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Parse doorcard title to extract components
 */
export function parseDoorcardTitle(title: string): {
  facultyName?: string;
  term?: TermSeason;
  year?: number;
} {
  // Match pattern: "Faculty Name - Term Year"
  const match = title.match(/^(.+?)\s*-\s*(Fall|Spring|Summer)\s+(\d{4})$/i);
  
  if (!match) {
    return { facultyName: title };
  }

  const [, facultyName, termStr, yearStr] = match;
  
  let term: TermSeason | undefined;
  switch (termStr.toLowerCase()) {
    case "fall":
      term = "FALL";
      break;
    case "spring":
      term = "SPRING";
      break;
    case "summer":
      term = "SUMMER";
      break;
  }

  const year = parseInt(yearStr, 10);

  return {
    facultyName: facultyName.trim(),
    term,
    year: isNaN(year) ? undefined : year,
  };
}

/**
 * Preview what the doorcard title will look like
 */
export function previewDoorcardTitle(
  facultyName: string,
  term?: string,
  year?: string
): string {
  if (!facultyName.trim()) {
    return "Faculty Name - Term Year";
  }

  if (!term || !year) {
    return `${facultyName} - Term Year`;
  }

  const termName = formatTermName(term as TermSeason);
  return `${facultyName} - ${termName} ${year}`;
}

/**
 * Validate doorcard title components
 */
export function validateDoorcardTitleComponents({
  facultyName,
  term,
  year,
}: {
  facultyName: string;
  term: string;
  year: string;
}): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!facultyName.trim()) {
    errors.push("Faculty name is required");
  }

  if (!term) {
    errors.push("Term is required");
  } else if (!["FALL", "SPRING", "SUMMER"].includes(term)) {
    errors.push("Invalid term");
  }

  if (!year) {
    errors.push("Year is required");
  } else {
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
      errors.push("Year must be between 2020 and 2030");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Common subtitle suggestions based on context
 */
export const SUBTITLE_SUGGESTIONS = [
  "Office Hours",
  "Teaching Schedule", 
  "Academic Schedule",
  "Consultation Hours",
  "Faculty Availability",
  "Department Schedule",
  "Contact Information",
] as const;

/**
 * Generate subtitle suggestions based on doorcard content
 */
export function generateSubtitleSuggestions(context?: {
  hasOfficeHours?: boolean;
  hasClasses?: boolean;
  hasLabs?: boolean;
}): string[] {
  const suggestions: string[] = [...SUBTITLE_SUGGESTIONS];

  if (context?.hasOfficeHours) {
    suggestions.unshift("Office Hours & Schedule");
  }

  if (context?.hasClasses && context?.hasLabs) {
    suggestions.unshift("Classes & Lab Schedule");
  } else if (context?.hasClasses) {
    suggestions.unshift("Class Schedule");
  } else if (context?.hasLabs) {
    suggestions.unshift("Lab Schedule");
  }

  return suggestions.slice(0, 5); // Return top 5 suggestions
}