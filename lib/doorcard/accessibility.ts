import { formatTimeRange, ALL_DAYS } from "@/lib/doorcard/doorcard-constants";
import type {
  AppointmentLite,
  SemanticScheduleData,
  DoorcardLite,
  DaySchedule,
} from "./types";
import { CATEGORY_LABELS } from "./print-optimization";

/**
 * Accessibility utilities for screen readers and assistive technologies
 */

/**
 * Creates semantic schedule data for accessibility
 */
export function createSemanticScheduleData(
  doorcard: DoorcardLite,
  includeWeekends = false
): SemanticScheduleData {
  const daysToInclude = includeWeekends
    ? ALL_DAYS.map((d) => d.key)
    : ALL_DAYS.filter((d) => d.key !== "SATURDAY" && d.key !== "SUNDAY").map(
        (d) => d.key
      );

  const daySchedules: DaySchedule[] = daysToInclude.map((dayKey) => {
    const dayAppointments = doorcard.appointments.filter(
      (apt) => apt.dayOfWeek === dayKey
    );

    return {
      dayKey,
      dayLabel: dayKey.charAt(0) + dayKey.slice(1).toLowerCase(),
      appointments: dayAppointments,
      hasAppointments: dayAppointments.length > 0,
    };
  });

  return {
    facultyName: doorcard.name || "Faculty Member",
    semesterInfo: `${doorcard.term || "Term"} ${doorcard.year || "Year"}`,
    officeInfo: doorcard.officeNumber || "Office TBD",
    website: doorcard.user?.website || undefined,
    daySchedules,
    hasWeekendAppointments: doorcard.appointments.some(
      (apt) => apt.dayOfWeek === "SATURDAY" || apt.dayOfWeek === "SUNDAY"
    ),
  };
}

/**
 * Creates accessible description for an appointment
 */
export function createAppointmentAriaLabel(
  appointment: AppointmentLite
): string {
  const timeRange = formatTimeRange(appointment.startTime, appointment.endTime);
  const category = CATEGORY_LABELS[appointment.category];
  const location = appointment.location ? ` in ${appointment.location}` : "";

  return `${appointment.name}, ${timeRange}${location}, ${category}`;
}

/**
 * Creates accessible description for a day schedule
 */
export function createDayScheduleAriaLabel(
  dayLabel: string,
  appointmentCount: number
): string {
  if (appointmentCount === 0) {
    return `${dayLabel}: No appointments scheduled`;
  }

  const plural = appointmentCount === 1 ? "appointment" : "appointments";
  return `${dayLabel}: ${appointmentCount} ${plural}`;
}

/**
 * Creates accessible description for the entire schedule
 */
export function createScheduleAriaDescription(
  scheduleData: SemanticScheduleData
): string {
  const totalAppointments = scheduleData.daySchedules.reduce(
    (total, day) => total + day.appointments.length,
    0
  );

  const daysWithAppointments = scheduleData.daySchedules.filter(
    (day) => day.hasAppointments
  ).length;

  const scheduleType = scheduleData.hasWeekendAppointments
    ? "seven day"
    : "weekday";

  return (
    `Weekly schedule for ${scheduleData.facultyName}, ${scheduleData.semesterInfo}. ` +
    `${totalAppointments} appointments across ${daysWithAppointments} days in this ${scheduleType} schedule.`
  );
}

/**
 * Generates screen reader optimized content
 */
export function generateScreenReaderContent(
  scheduleData: SemanticScheduleData
): {
  scheduleDescription: string;
  dayDescriptions: Array<{
    dayLabel: string;
    ariaLabel: string;
    appointments: Array<{
      name: string;
      ariaLabel: string;
    }>;
  }>;
} {
  return {
    scheduleDescription: createScheduleAriaDescription(scheduleData),
    dayDescriptions: scheduleData.daySchedules
      .filter((day) => day.hasAppointments)
      .map((day) => ({
        dayLabel: day.dayLabel,
        ariaLabel: createDayScheduleAriaLabel(
          day.dayLabel,
          day.appointments.length
        ),
        appointments: day.appointments.map((appointment) => ({
          name: appointment.name,
          ariaLabel: createAppointmentAriaLabel(appointment),
        })),
      })),
  };
}

/**
 * Checks if content meets basic accessibility guidelines
 */
export function validateAccessibility(scheduleData: SemanticScheduleData): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for empty schedule
  const totalAppointments = scheduleData.daySchedules.reduce(
    (total, day) => total + day.appointments.length,
    0
  );

  if (totalAppointments === 0) {
    warnings.push("Schedule contains no appointments");
  }

  // Check for appointments without proper names
  scheduleData.daySchedules.forEach((day) => {
    day.appointments.forEach((appointment) => {
      if (!appointment.name.trim()) {
        warnings.push(`Appointment on ${day.dayLabel} has empty name`);
      }

      if (!appointment.startTime || !appointment.endTime) {
        warnings.push(
          `Appointment "${appointment.name}" missing time information`
        );
      }
    });
  });

  // Check for faculty name
  if (!scheduleData.facultyName.trim()) {
    warnings.push("Faculty name is missing");
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
