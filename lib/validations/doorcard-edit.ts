import { z } from "zod";
import { College, DayOfWeek, AppointmentCategory } from "@prisma/client";

/**
 * Schema for the "basic info" step.
 * Note: 'name' is derived from user profile, not user input
 */
export const basicInfoSchema = z.object({
  doorcardName: z.string().max(100).optional().default(""),
  officeNumber: z.string().min(1, "Office number is required"),
  term: z.string().min(1, "Term is required"),
  year: z.string().min(1, "Year is required"),
  college: z.nativeEnum(College, { required_error: "Campus is required" }),
});

/**
 * A single time block row. Times use 24h HH:mm format.
 */
export const timeBlockSchema = z
  .object({
    id: z.string(),
    day: z.nativeEnum(DayOfWeek, { required_error: "Day is required" }),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:mm)"),
    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:mm)"),
    activity: z.string().min(1, "Activity is required"),
    location: z.string().nullable().optional(),
    category: z.nativeEnum(AppointmentCategory).optional(),
  })
  .refine((val) => val.endTime > val.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

/**
 * Full doorcard editor schema (basic info + time blocks).
 */
export const doorcardEditorSchema = basicInfoSchema.extend({
  timeBlocks: z
    .array(timeBlockSchema)
    .min(1, "At least one time block is required"),
});

/* ----- Inferred Types ----- */
export type BasicInfoForm = z.infer<typeof basicInfoSchema>;
export type TimeBlockForm = z.infer<typeof timeBlockSchema>;
export type DoorcardForm = z.infer<typeof doorcardEditorSchema>;
