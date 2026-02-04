import type { DayOfWeek } from "@prisma/client";
import { formatDisplayName } from "@/lib/display-name";
import { DAY_ORDER, DAY_LABELS } from "@/lib/doorcard/doorcard-constants";
import type {
  AppointmentLite,
  DoorcardLite,
  DaySchedule,
  SemanticScheduleData,
} from "./types";

/**
 * Semantic structure utilities for ADA-compliant, print-optimized doorcard rendering
 */

// Day order and labels are now imported from shared constants

/**
 * Groups appointments by day and sorts them chronologically
 */
export function groupAppointmentsByDay(
  appointments: AppointmentLite[]
): Partial<Record<DayOfWeek, AppointmentLite[]>> {
  const grouped: Partial<Record<DayOfWeek, AppointmentLite[]>> = {};

  for (const appointment of appointments) {
    if (!grouped[appointment.dayOfWeek]) {
      grouped[appointment.dayOfWeek] = [];
    }
    grouped[appointment.dayOfWeek]!.push(appointment);
  }

  // Sort appointments within each day by start time
  Object.values(grouped).forEach((dayAppointments) => {
    dayAppointments?.sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  return grouped;
}

/**
 * Determines which days should be displayed based on appointment data
 */
export function getDisplayDays(
  appointments: AppointmentLite[],
  forceShowWeekends = false
): DayOfWeek[] {
  const hasWeekendAppointments = appointments.some(
    (apt) => apt.dayOfWeek === "SATURDAY" || apt.dayOfWeek === "SUNDAY"
  );

  const allDays: DayOfWeek[] = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];
  const weekdayDays: DayOfWeek[] = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ];

  return hasWeekendAppointments || forceShowWeekends ? allDays : weekdayDays;
}

/**
 * Creates semantic schedule data structure optimized for both accessibility and print
 */
export function createSemanticScheduleData(
  doorcard: DoorcardLite,
  forceShowWeekends = false
): SemanticScheduleData {
  const groupedAppointments = groupAppointmentsByDay(doorcard.appointments);
  const displayDays = getDisplayDays(doorcard.appointments, forceShowWeekends);

  const daySchedules: DaySchedule[] = displayDays.map((dayKey) => ({
    dayKey,
    dayLabel: DAY_LABELS[dayKey],
    appointments: groupedAppointments[dayKey] || [],
    hasAppointments: (groupedAppointments[dayKey]?.length || 0) > 0,
  }));

  const facultyName = doorcard.user
    ? formatDisplayName(doorcard.user)
    : doorcard.name || "Faculty Name";

  const semesterInfo = `${doorcard.term} ${doorcard.year}`;
  const officeInfo = doorcard.officeNumber || "Office TBD";

  return {
    facultyName,
    semesterInfo,
    officeInfo,
    website: doorcard.user?.website || undefined,
    daySchedules,
    hasWeekendAppointments: doorcard.appointments.some(
      (apt) => apt.dayOfWeek === "SATURDAY" || apt.dayOfWeek === "SUNDAY"
    ),
  };
}

/**
 * Generates semantic HTML IDs for accessibility
 */
export function generateSemanticIds(containerId: string) {
  return {
    scheduleTitle: `${containerId}-title`,
    weeklySchedule: `${containerId}-weekly`,
    dayPrefix: `${containerId}-day`,
    appointmentPrefix: `${containerId}-apt`,
  };
}
