/**
 * Consolidated TimeBlock Schema Definitions
 *
 * This is the single source of truth for time block / appointment validation schemas.
 * All other files should import from here.
 *
 * Field naming conventions:
 * - Form fields use: `day`, `activity` (user-facing, matches form inputs)
 * - Database fields use: `dayOfWeek`, `name` (Prisma schema)
 * - Both are supported for backward compatibility
 */

import { z } from "zod";
import { DayOfWeek, AppointmentCategory } from "@prisma/client";

// Time format validation (24-hour HH:MM)
export const timeFormatSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:mm)");

// Day of week validation
export const dayOfWeekSchema = z.nativeEnum(DayOfWeek, {
  required_error: "Day is required",
});

// Appointment category validation
export const appointmentCategorySchema = z.nativeEnum(AppointmentCategory);

/**
 * Strict schema for form input validation.
 * Used by the doorcard editor form.
 * Uses `day` and `activity` as the form field names.
 */
export const timeBlockFormSchema = z
  .object({
    id: z.string(),
    day: dayOfWeekSchema,
    startTime: timeFormatSchema,
    endTime: timeFormatSchema,
    activity: z.string().min(1, "Activity is required"),
    location: z.string().nullable().optional(),
    category: appointmentCategorySchema.optional(),
  })
  .refine((val) => val.endTime > val.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

/**
 * Loose schema for API input that accepts both legacy and current field names.
 * Used for API routes and data migration.
 * Accepts: day/dayOfWeek, activity/name
 */
export const timeBlockInputSchema = z.object({
  id: z.string().optional(),
  // Accept both field names for day
  day: z.string().optional(),
  dayOfWeek: z.string().optional(),
  // Accept both field names for activity/name
  activity: z.string().optional(),
  name: z.string().optional(),
  // Time fields
  startTime: z.string(),
  endTime: z.string(),
  // Optional fields
  category: z.string().optional(),
  location: z.string().nullable().optional(),
});

/**
 * Schema for database appointment records.
 * Uses Prisma field names: dayOfWeek, name
 */
export const appointmentSchema = z.object({
  id: z.string().optional(),
  doorcardId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  startTime: timeFormatSchema,
  endTime: timeFormatSchema,
  dayOfWeek: dayOfWeekSchema,
  category: appointmentCategorySchema.default("OFFICE_HOURS"),
  location: z.string().nullable().optional(),
});

// Type exports
export type TimeBlockForm = z.infer<typeof timeBlockFormSchema>;
export type TimeBlockInput = z.infer<typeof timeBlockInputSchema>;
export type AppointmentRecord = z.infer<typeof appointmentSchema>;

/**
 * Normalize time block input to database format.
 * Converts form field names (day, activity) to database field names (dayOfWeek, name).
 */
export function normalizeTimeBlock(input: TimeBlockInput): {
  id?: string;
  name: string;
  startTime: string;
  endTime: string;
  dayOfWeek: DayOfWeek;
  category: AppointmentCategory;
  location: string | null;
} {
  return {
    id: input.id,
    name: input.activity || input.name || "Office Hours",
    startTime: input.startTime,
    endTime: input.endTime,
    dayOfWeek: (input.dayOfWeek || input.day || "MONDAY") as DayOfWeek,
    category: (input.category || "OFFICE_HOURS") as AppointmentCategory,
    location: input.location ?? null,
  };
}

/**
 * Convert database appointment to form format.
 * Converts database field names (dayOfWeek, name) to form field names (day, activity).
 */
export function toFormTimeBlock(appointment: {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  dayOfWeek: DayOfWeek;
  category: AppointmentCategory;
  location: string | null;
}): TimeBlockForm {
  return {
    id: appointment.id,
    day: appointment.dayOfWeek,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    activity: appointment.name,
    category: appointment.category,
    location: appointment.location,
  };
}

// Re-export for backward compatibility
// These match the names used in existing imports
export { timeBlockFormSchema as timeBlockSchema };
