import type {
  Prisma,
  User as PrismaUser,
  Appointment as PrismaAppointment,
  DoorcardAnalytics as PrismaDoorcardAnalytics,
  DoorcardMetrics as PrismaDoorcardMetrics,
  Term as PrismaTerm,
  College,
  DayOfWeek,
  AppointmentCategory,
  AnalyticsEvent,
} from "@prisma/client";

// Re-export Prisma enum types so other modules can import them from here.
export type { College, DayOfWeek, AppointmentCategory, AnalyticsEvent };

/* ============================================================================
 * ENUM / CONSTANT HELPERS
 * ========================================================================== */

// Use const arrays for iteration in UI and derive union from Prisma enums if needed.
export const COLLEGES = ["SKYLINE", "CSM", "CANADA"] as const;
export const USER_ROLES = ["FACULTY", "ADMIN", "STAFF"] as const;
export const DAYS_OF_WEEK: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
export const APPOINTMENT_CATEGORIES: AppointmentCategory[] = [
  "OFFICE_HOURS",
  "IN_CLASS",
  "LECTURE",
  "LAB",
  "HOURS_BY_ARRANGEMENT",
  "REFERENCE",
];

/** Metadata map keyed by category for O(1) lookup. */
export const APPOINTMENT_CATEGORY_META: Record<
  AppointmentCategory,
  { label: string; color: string }
> = {
  OFFICE_HOURS: { label: "Office Hours", color: "#E1E2CA" },
  IN_CLASS: { label: "In Class", color: "#99B5D5" },
  LECTURE: { label: "Lecture", color: "#D599C5" },
  LAB: { label: "Lab", color: "#EDAC80" },
  HOURS_BY_ARRANGEMENT: { label: "Hours by Arrangement", color: "#99D5A1" },
  REFERENCE: { label: "Reference", color: "#AD99D5" },
  OTHER: { label: "Other", color: "#D1D5DB" },
};

export const COLLEGE_META: Record<College, { label: string }> = {
  SKYLINE: { label: "Skyline College" },
  CSM: { label: "College of San Mateo" },
  CANADA: { label: "Cañada College" },
  DISTRICT_OFFICE: { label: "District Office" },
};

/* ============================================================================
 * PRISMA-DERIVED ENTITY TYPES
 * ========================================================================== */

// Base models (no relations). These come directly from the generated client.
export type User = PrismaUser;
export type Appointment = PrismaAppointment;
export type DoorcardAnalytics = PrismaDoorcardAnalytics;
export type DoorcardMetrics = PrismaDoorcardMetrics;
export type Term = PrismaTerm;

// Doorcard with *all* relations we commonly need.
export type DoorcardWithRelations = Prisma.DoorcardGetPayload<{
  include: {
    Appointment: true;
    User: true;
    DoorcardMetrics: true;
    DoorcardAnalytics: true;
    Term: true;
  };
}>;

// Light-weight variant for list screens (omit heavy arrays like analytics).
export type DoorcardListItem = Prisma.DoorcardGetPayload<{
  include: {
    Appointment: true;
    User: true;
    DoorcardMetrics: true;
    Term: true;
  };
}>;

// Public-facing sanitized view (remove email & internal analytics).
export type PublicDoorcardView = Omit<
  DoorcardWithRelations,
  "analytics" | "user"
> & {
  user: Pick<User, "id" | "name" | "college">;
};

/* ============================================================================
 * LEGACY / TRANSITION TYPES
 * ========================================================================== */

/**
 * @deprecated Use `Appointment` instead. Retained only during migration of
 * components that still depend on TimeBlock shape. Remove after 2025-09-01.
 */
export interface TimeBlock {
  id: string;
  day: DayOfWeek;
  startTime: string; // "HH:mm"
  endTime: string;
  activity: string;
  location?: string;
  category: AppointmentCategory;
}

/* ============================================================================
 * FORM / INPUT DTOs
 * ========================================================================== */

export interface CreateAppointmentData {
  name: string;
  startTime: string; // "HH:mm"
  endTime: string;
  dayOfWeek: DayOfWeek;
  category: AppointmentCategory;
  location?: string;
}

export interface CreateDoorcardData {
  name: string;
  doorcardName: string;
  officeNumber: string;
  term: string;
  year: string;
  college?: College;
  startDate?: Date;
  endDate?: Date;
  appointments: CreateAppointmentData[];
}

/* ============================================================================
 * API RESULT HELPERS
 * ========================================================================== */

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

export type DoorcardResponse = ApiResult<DoorcardWithRelations>;
export type DoorcardListResponse = ApiResult<DoorcardListItem[]>;

/* ============================================================================
 * MISC / UTILITY TYPES
 * ========================================================================== */

// Weekly schedule map (always arrays; can be empty).
export type WeeklySchedule = Record<DayOfWeek, Appointment[]>;

// Analytics event tuple used for logging pipelines.
export interface AnalyticsRecord {
  doorcardId: string;
  eventType: AnalyticsEvent;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}
