"use client";
import { useState } from "react";
import {
  TIME_SLOTS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  formatTimeRange,
  extractCourseCode,
  ALL_DAYS,
  DAY_ORDER,
} from "@/lib/doorcard-constants";
import { formatDisplayName } from "@/lib/display-name";
import { Grid, List, Clock } from "lucide-react";
import type { AppointmentCategory, DayOfWeek } from "@prisma/client";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface AppointmentLite {
  id: string;
  name: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
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

interface UnifiedDoorcardProps {
  doorcard: DoorcardLite;
  showWeekendDays?: boolean;
  containerId?: string;
  defaultView?: "week" | "list";
  showViewToggle?: boolean;
}

type ViewMode = "week" | "list";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

// Days and day order are now imported from shared constants
const DAY_LABELS = ALL_DAYS;

function minutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function groupByDay(appts: AppointmentLite[]) {
  const map: Partial<Record<DayOfWeek, AppointmentLite[]>> = {};
  for (const a of appts) {
    (map[a.dayOfWeek] ||= []).push(a);
  }
  for (const list of Object.values(map)) {
    list.sort((x, y) => x.startTime.localeCompare(y.startTime));
  }
  return map;
}

// Calculate precise positioning for appointments (no overlaps expected)
function getAppointmentLayout(appointments: AppointmentLite[]) {
  if (appointments.length === 0) return [];

  // Calculate positions for each appointment
  const result: {
    appointment: AppointmentLite;
    position: {
      top: number;
      height: number;
      left: number;
      width: number;
    };
  }[] = [];

  appointments.forEach((appointment) => {
    const startMinutes = minutes(appointment.startTime);
    const endMinutes = minutes(appointment.endTime);
    const duration = endMinutes - startMinutes;

    // Grid spans from 7:00 AM (420 minutes) to 10:00 PM (1320 minutes)
    const gridStartMinutes = 7 * 60;
    const gridEndMinutes = 22 * 60;
    const totalGridMinutes = gridEndMinutes - gridStartMinutes;

    // Calculate position as percentage
    const topPercent =
      ((startMinutes - gridStartMinutes) / totalGridMinutes) * 100;
    const heightPercent = (duration / totalGridMinutes) * 100;

    result.push({
      appointment,
      position: {
        top: Math.max(0, topPercent),
        height: Math.max(3, heightPercent), // Minimum height of 3%
        left: 0,
        width: 100,
      },
    });
  });

  return result;
}

/* -------------------------------------------------------------------------- */
/* Calendar View Component                                                    */
/* -------------------------------------------------------------------------- */

function CalendarView({
  doorcard,
  showWeekendDays,
}: {
  doorcard: DoorcardLite;
  showWeekendDays: boolean;
}) {
  const byDay = groupByDay(doorcard.appointments);

  const days = DAY_LABELS.filter((d) =>
    showWeekendDays ? true : d.key !== "SATURDAY" && d.key !== "SUNDAY"
  );

  return (
    <>
      {/* Screen reader accessible appointment list */}
      <div className="sr-only" aria-label="Calendar Schedule">
        <h3>Weekly Calendar View</h3>
        {days.map((day) => {
          const dayAppointments = byDay[day.key] || [];
          if (dayAppointments.length === 0) return null;

          return (
            <div key={day.key}>
              <h4>{day.label}</h4>
              <ol>
                {dayAppointments.map((appointment) => (
                  <li key={appointment.id}>
                    {appointment.name} from{" "}
                    {formatTimeRange(
                      appointment.startTime,
                      appointment.endTime
                    )}
                    {appointment.location && ` at ${appointment.location}`},
                    Category: {CATEGORY_LABELS[appointment.category]}
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>

      <div
        className="overflow-hidden rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
        aria-hidden="true"
      >
        {/* Professional Calendar Grid */}
        <div className="grid grid-cols-[100px_1fr] min-h-[600px] print:min-h-[500px]">
          {/* Time Labels Column */}
          <div className="border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="p-2 text-xs font-medium border-b border-gray-200 dark:border-gray-700">
              Time
            </div>
            <div className="relative h-full">
              {TIME_SLOTS.map((slot, index) => (
                <div
                  key={slot.value}
                  className="absolute w-full px-2 text-center text-[11px] text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800"
                  style={{
                    top: `${(index / TIME_SLOTS.length) * 100}%`,
                    height: `${100 / TIME_SLOTS.length}%`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {slot.label}
                </div>
              ))}
            </div>
          </div>

          {/* Days Grid */}
          <div
            className={`grid min-h-[600px] print:min-h-[500px] ${
              days.length === 7
                ? "grid-cols-7"
                : days.length === 6
                  ? "grid-cols-6"
                  : days.length === 5
                    ? "grid-cols-5"
                    : days.length === 4
                      ? "grid-cols-4"
                      : days.length === 3
                        ? "grid-cols-3"
                        : days.length === 2
                          ? "grid-cols-2"
                          : "grid-cols-1"
            }`}
          >
            {days.map((day) => {
              const dayAppointments = byDay[day.key] || [];
              const layoutItems = getAppointmentLayout(dayAppointments);

              return (
                <div
                  key={day.key}
                  className="border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                >
                  {/* Day Header */}
                  <div className="p-2 text-center text-xs font-medium border-b border-gray-200 dark:border-gray-700">
                    {day.label}
                  </div>

                  {/* Day Content Area with Non-Overlapping Positioning */}
                  <div className="relative h-full overflow-hidden">
                    {/* Grid Lines for Visual Reference */}
                    {TIME_SLOTS.map((_, index) => (
                      <div
                        key={index}
                        className="absolute w-full border-t border-gray-100 dark:border-gray-800"
                        style={{
                          top: `${(index / TIME_SLOTS.length) * 100}%`,
                        }}
                      />
                    ))}

                    {/* Precisely Positioned Appointments */}
                    {layoutItems.map(({ appointment, position }) => (
                      <div
                        key={appointment.id}
                        className="absolute p-1 text-center text-xs rounded shadow-sm print:shadow-none print:border print:border-gray-400 overflow-hidden"
                        style={{
                          top: `${position.top}%`,
                          height: `${position.height}%`,
                          left: `${position.left}%`,
                          width: `${position.width}%`,
                          backgroundColor:
                            CATEGORY_COLORS[appointment.category] ?? "#f0f0f0",
                          minHeight: "40px",
                        }}
                      >
                        <div className="h-full w-full flex flex-col justify-center">
                          <div className="font-semibold leading-tight overflow-hidden">
                            <span
                              className="block truncate"
                              title={appointment.name}
                            >
                              {extractCourseCode(appointment.name)}
                            </span>
                          </div>
                          <div className="text-[10px] leading-tight overflow-hidden">
                            <span className="block truncate">
                              {formatTimeRange(
                                appointment.startTime,
                                appointment.endTime
                              )}
                            </span>
                          </div>
                          {appointment.location && (
                            <div className="text-[9px] text-gray-700 leading-tight overflow-hidden">
                              <span
                                className="block truncate"
                                title={appointment.location}
                              >
                                {appointment.location}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* List View Component                                                        */
/* -------------------------------------------------------------------------- */

function ListView({
  doorcard,
  showWeekendDays,
}: {
  doorcard: DoorcardLite;
  showWeekendDays: boolean;
}) {
  const byDay = groupByDay(doorcard.appointments);

  const days = DAY_LABELS.filter((d) =>
    showWeekendDays ? true : d.key !== "SATURDAY" && d.key !== "SUNDAY"
  );

  const appointmentsByDay = days
    .map((day) => ({
      day,
      appointments: byDay[day.key] || [],
    }))
    .filter((dayGroup) => dayGroup.appointments.length > 0);

  return (
    <div className="space-y-6">
      {appointmentsByDay.map(({ day, appointments }) => (
        <div
          key={day.key}
          className="border rounded-lg border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
              {day.label}
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Color indicator */}
                  <div
                    className="w-4 h-4 rounded-sm flex-shrink-0 mt-0.5 border"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[appointment.category] ?? "#f0f0f0",
                    }}
                  />

                  {/* Appointment details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      {appointment.name}
                    </h4>

                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium">
                        {formatTimeRange(
                          appointment.startTime,
                          appointment.endTime
                        )}
                      </span>
                      <span className="text-gray-500">
                        {CATEGORY_LABELS[appointment.category]}
                      </span>
                      {appointment.location && (
                        <span className="text-gray-500">
                          📍 {appointment.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {appointmentsByDay.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No appointments scheduled</p>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function UnifiedDoorcard({
  doorcard,
  showWeekendDays = false,
  containerId = "doorcard-schedule",
  defaultView = "week",
  showViewToggle = true,
}: UnifiedDoorcardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);

  // Check if any appointments fall on weekends
  const hasWeekendAppointments = doorcard.appointments.some(
    (apt) => apt.dayOfWeek === "SATURDAY" || apt.dayOfWeek === "SUNDAY"
  );

  // Override showWeekendDays if weekend appointments exist
  const effectiveShowWeekends = showWeekendDays || hasWeekendAppointments;

  return (
    <div id={containerId} className="space-y-4">
      <header className="border-b border-gray-300 dark:border-gray-600 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-red-700 dark:text-red-400">
              {doorcard.user
                ? formatDisplayName(doorcard.user)
                : doorcard.name || "Faculty Name"}
            </h1>
            <div className="mt-1 flex flex-wrap gap-x-6 text-xs text-gray-700 dark:text-gray-300">
              <div>
                <strong>Semester:</strong> {doorcard.term} {doorcard.year}
              </div>
              <div>
                <strong>Office:</strong> {doorcard.officeNumber}
              </div>
              {doorcard.college && (
                <div>
                  <strong>College:</strong> {doorcard.college}
                </div>
              )}
              {doorcard.user?.website && (
                <div>
                  <strong>Website:</strong>{" "}
                  <a
                    href={
                      doorcard.user.website.startsWith("http")
                        ? doorcard.user.website
                        : `https://${doorcard.user.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                  >
                    Faculty Website
                  </a>
                </div>
              )}
            </div>
          </div>

          {showViewToggle && (
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={() => setViewMode("week")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "week"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
                title="Calendar view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {viewMode === "week" ? (
        <CalendarView
          doorcard={doorcard}
          showWeekendDays={effectiveShowWeekends}
        />
      ) : (
        <ListView doorcard={doorcard} showWeekendDays={effectiveShowWeekends} />
      )}

      <div className="mt-4 grid max-w-sm grid-cols-2 gap-2 print:break-inside-avoid">
        {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
          <div key={k} className="flex items-center gap-2 text-xs">
            <span
              className="h-4 w-4 rounded-sm border"
              style={{
                backgroundColor: CATEGORY_COLORS[k as AppointmentCategory],
              }}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default UnifiedDoorcard;
