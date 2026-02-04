import { Appointment, DayOfWeek, AppointmentCategory } from "@prisma/client";
import {
  timeBlockInputSchema,
  normalizeTimeBlock,
  type TimeBlockInput,
} from "../validations/time-block";

export interface TimeBlock {
  id?: string;
  startTime: string;
  endTime: string;
  dayOfWeek: DayOfWeek;
  activity?: string;
  name?: string;
  location?: string | null;
  category?: string;
}

// Re-export for backward compatibility
export { timeBlockInputSchema as timeBlockSchema, type TimeBlockInput };

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates appointments for overlaps, but is tolerant of existing data.
 *
 * Strategy:
 * - For existing appointments (with IDs), we check if they've changed
 * - Only validate overlaps for NEW or MODIFIED appointments
 * - This prevents blocking users from accessing doorcards with existing overlaps
 */
export function validateAppointments(
  newAppointments: TimeBlock[],
  existingAppointments: Appointment[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Create a map of existing appointments by ID for quick lookup
  const existingMap = new Map(existingAppointments.map((apt) => [apt.id, apt]));

  // Check each appointment
  for (let i = 0; i < newAppointments.length; i++) {
    const appointment = newAppointments[i];

    // Basic validation
    if (!appointment.startTime || !appointment.endTime) {
      errors.push(`Appointment ${i + 1}: Missing start or end time`);
      continue;
    }

    if (appointment.endTime <= appointment.startTime) {
      errors.push(`Appointment ${i + 1}: End time must be after start time`);
      continue;
    }

    // Check if this is an existing appointment that hasn't changed
    const isUnchanged =
      appointment.id &&
      existingMap.has(appointment.id) &&
      isAppointmentUnchanged(appointment, existingMap.get(appointment.id)!);

    if (isUnchanged) {
      // Skip overlap validation for unchanged appointments
      continue;
    }

    // Check for overlaps with other appointments on the same day
    for (let j = 0; j < newAppointments.length; j++) {
      if (i === j) continue;

      const other = newAppointments[j];
      if (appointment.dayOfWeek !== other.dayOfWeek) continue;

      // Check if there's an overlap
      const overlap = checkTimeOverlap(
        appointment.startTime,
        appointment.endTime,
        other.startTime,
        other.endTime
      );

      if (overlap) {
        // If the other appointment is also unchanged, just warn
        const otherUnchanged =
          other.id &&
          existingMap.has(other.id) &&
          isAppointmentUnchanged(other, existingMap.get(other.id)!);

        if (otherUnchanged) {
          warnings.push(
            `Appointment ${i + 1} overlaps with existing appointment ${j + 1} on ${appointment.dayOfWeek}`
          );
        } else {
          errors.push(
            `Appointment ${i + 1} overlaps with appointment ${j + 1} on ${appointment.dayOfWeek}`
          );
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function isAppointmentUnchanged(
  newApt: TimeBlock,
  existingApt: Appointment
): boolean {
  return (
    newApt.startTime === existingApt.startTime &&
    newApt.endTime === existingApt.endTime &&
    newApt.dayOfWeek === existingApt.dayOfWeek &&
    (newApt.name || newApt.activity || "") === (existingApt.name || "") &&
    (newApt.location ?? null) === (existingApt.location ?? null) &&
    (newApt.category || "OFFICE_HOURS") === existingApt.category
  );
}

function checkTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  // Convert times to comparable format (assuming HH:MM format)
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const start1Min = toMinutes(start1);
  const end1Min = toMinutes(end1);
  const start2Min = toMinutes(start2);
  const end2Min = toMinutes(end2);

  return (
    (start1Min >= start2Min && start1Min < end2Min) ||
    (end1Min > start2Min && end1Min <= end2Min) ||
    (start1Min <= start2Min && end1Min >= end2Min)
  );
}

/**
 * Prepare appointments for database insertion
 * Normalizes the various field names used in the codebase
 */
export function normalizeAppointments(
  blocks: TimeBlockInput[] | undefined,
  doorcardId: string
): Array<{
  id?: string;
  doorcardId: string;
  name: string;
  startTime: string;
  endTime: string;
  dayOfWeek: DayOfWeek;
  category: AppointmentCategory;
  location: string | null;
}> {
  if (!blocks || blocks.length === 0) return [];

  return blocks.map((b) => ({
    ...normalizeTimeBlock(b),
    doorcardId,
  }));
}
