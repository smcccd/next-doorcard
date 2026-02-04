import { z } from "zod";
import { College } from "@prisma/client";

// Re-export time block schema from consolidated source
export {
  timeBlockFormSchema as timeBlockSchema,
  type TimeBlockForm,
} from "./time-block";

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
 * Full doorcard editor schema (basic info + time blocks).
 */
import { timeBlockFormSchema } from "./time-block";
export const doorcardEditorSchema = basicInfoSchema.extend({
  timeBlocks: z
    .array(timeBlockFormSchema)
    .min(1, "At least one time block is required"),
});

/* ----- Inferred Types ----- */
export type BasicInfoForm = z.infer<typeof basicInfoSchema>;
export type DoorcardForm = z.infer<typeof doorcardEditorSchema>;
