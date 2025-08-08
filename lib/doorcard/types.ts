import type { AppointmentCategory, DayOfWeek } from "@prisma/client";

/**
 * Shared types for semantic doorcard components
 */

export interface AppointmentLite {
  id: string;
  name: string;
  startTime: string; // "HH:mm" format
  endTime: string; // "HH:mm" format
  dayOfWeek: DayOfWeek;
  category: AppointmentCategory;
  location?: string | null;
}

export interface DoorcardLite {
  name?: string;
  doorcardName?: string;
  officeNumber?: string;
  term?: string;
  year?: string;
  college?: string | null;
  appointments: AppointmentLite[];
  user?: {
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    title?: string | null;
    pronouns?: string | null;
    displayFormat?: any;
    website?: string | null;
  };
}

export interface DaySchedule {
  dayKey: DayOfWeek;
  dayLabel: string;
  appointments: AppointmentLite[];
  hasAppointments: boolean;
}

export interface SemanticScheduleData {
  facultyName: string;
  semesterInfo: string;
  officeInfo: string;
  website?: string;
  daySchedules: DaySchedule[];
  hasWeekendAppointments: boolean;
}

export type ViewMode = "screen" | "print" | "pdf";

export interface DoorcardDisplayOptions {
  viewMode: ViewMode;
  showWeekends: boolean;
  showViewToggle: boolean;
  containerId: string;
}
