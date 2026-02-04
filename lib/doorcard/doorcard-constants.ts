// Shared constants for doorcard display components
import { convertToPST } from "../utils";

// Re-export utility functions
export { convertToPST } from "../utils";

// Days configuration
export const DAYS_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const DAYS_WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

export const DAY_ABBREVIATIONS = [
  "Mon",
  "Tues",
  "Wed",
  "Thurs",
  "Fri",
  "Sat",
  "Sun",
];

// Short day abbreviations for badges (clearer than academic R for Thursday)
export const DAY_SHORT_ABBREV = {
  MONDAY: "M",
  TUESDAY: "T",
  WEDNESDAY: "W",
  THURSDAY: "Th",
  FRIDAY: "F",
  SATURDAY: "S",
  SUNDAY: "Su",
} as const;

// Full day labels for display
export const DAY_LABELS = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
} as const;

// Day display arrays for components
export const ALL_DAYS = [
  { key: "MONDAY" as const, label: "Monday" },
  { key: "TUESDAY" as const, label: "Tuesday" },
  { key: "WEDNESDAY" as const, label: "Wednesday" },
  { key: "THURSDAY" as const, label: "Thursday" },
  { key: "FRIDAY" as const, label: "Friday" },
  { key: "SATURDAY" as const, label: "Saturday" },
  { key: "SUNDAY" as const, label: "Sunday" },
] as const;

export const WEEKDAYS_ONLY = ALL_DAYS.slice(0, 5);

// Day options for filters (includes 'ALL' option)
export const DAY_OPTIONS = [
  { value: "ALL" as const, label: "Any Day" },
  ...ALL_DAYS.map((day) => ({ value: day.key, label: day.label })),
] as const;

// Day order for sorting (Monday = 0, Sunday = 6)
export const DAY_ORDER = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
} as const;

// Sort days in calendar order (M-T-W-Th-F-S-Su)
export function sortDaysByCalendarOrder<T extends keyof typeof DAY_ORDER>(
  days: T[]
): T[] {
  return [...days].sort((a, b) => DAY_ORDER[a] - DAY_ORDER[b]);
}

// Time slots - standardized to 7AM-10PM (30 slots)
export const TIME_SLOTS = Array.from({ length: 30 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const minute = i % 2 === 0 ? "00" : "30";
  const value = `${hour.toString().padStart(2, "0")}:${minute}`;
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const period = hour >= 12 ? "PM" : "AM";
  const label = `${displayHour}:${minute} ${period}`;
  return { value, label, hour, minute: minute === "00" ? 0 : 30 };
});

// Category colors and labels
export const CATEGORY_COLORS = {
  OFFICE_HOURS: "#E1E2CA",
  IN_CLASS: "#99B5D5",
  LECTURE: "#D599C5",
  LAB: "#EDAC80",
  HOURS_BY_ARRANGEMENT: "#99D5A1",
  REFERENCE: "#AD99D5",
  OTHER: "#E5E7EB",
};

export const CATEGORY_LABELS = {
  OFFICE_HOURS: "Office Hours",
  IN_CLASS: "In Class",
  LECTURE: "Lecture",
  LAB: "Lab",
  HOURS_BY_ARRANGEMENT: "Hours by Arrangement",
  REFERENCE: "Reference",
  OTHER: "Other",
};

export const extractCourseCode = (activity: string) => {
  // If activity contains " - ", take only the part before it
  if (activity.includes(" - ")) {
    return activity.split(" - ")[0];
  }
  // If activity contains "CS", "MATH", etc., try to extract just the course code
  const courseCodeMatch = activity.match(/^([A-Z]{2,4}\s*\d{1,4}[A-Z]?)/);
  if (courseCodeMatch) {
    return courseCodeMatch[1];
  }
  // For activities like "Office Hours", "Lab", keep as is but make shorter
  if (activity.toLowerCase().includes("office hours")) return "Office Hours";
  if (activity.toLowerCase().includes("lab")) return "Lab";
  // Return first 12 characters to ensure it fits
  return activity.substring(0, 12);
};

export const getTimeInMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const formatTimeRange = (start: string, end: string) => {
  return `${convertToPST(start)} - ${convertToPST(end)}`;
};

// Activity styling for preview mode
export const getActivityStyle = (activity: string) => {
  switch (activity) {
    case "Office Hours":
      return "bg-green-50";
    case "Class":
      return "bg-blue-50";
    case "Lab Time":
      return "bg-yellow-50";
    case "TBA":
      return "bg-gray-50";
    default:
      return "bg-gray-50";
  }
};
