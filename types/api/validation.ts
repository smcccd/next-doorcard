// API Validation Types

// Re-export validation types from lib/validations/doorcard.ts
export type {
  BasicInfo,
  DoorcardData,
  CreateDoorcardData,
  UpdateDoorcardData,
  AppointmentData,
  CreateAppointmentData,
  UpdateAppointmentData,
  UserData,
} from "@/lib/validations/doorcard";

// Re-export time block types from consolidated source
export type { TimeBlockForm, TimeBlockInput } from "@/lib/validations/time-block";
// Backward compatibility alias
export type { TimeBlockForm as TimeBlockData } from "@/lib/validations/time-block";

// Re-export schemas for runtime validation
export * from "@/lib/validations/doorcard";
