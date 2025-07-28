// Server component (no "use client")
import {
  TIME_SLOTS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  formatTimeRange,
  extractCourseCode,
} from "@/lib/doorcard-constants";
import { formatDisplayName } from "@/lib/display-name";
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
  containerId?: string; // for client buttons
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const DAY_LABELS: { key: DayOfWeek; label: string }[] = [
  { key: "MONDAY", label: "Monday" },
  { key: "TUESDAY", label: "Tuesday" },
  { key: "WEDNESDAY", label: "Wednesday" },
  { key: "THURSDAY", label: "Thursday" },
  { key: "FRIDAY", label: "Friday" },
  { key: "SATURDAY", label: "Saturday" },
  { key: "SUNDAY", label: "Sunday" },
];

function minutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function durationRows(a: AppointmentLite) {
  return Math.ceil((minutes(a.endTime) - minutes(a.startTime)) / 30);
}
function isSlotCovered(a: AppointmentLite, slot: string) {
  const s = minutes(slot);
  return s >= minutes(a.startTime) && s < minutes(a.endTime);
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

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function UnifiedDoorcard({
  doorcard,
  showWeekendDays = true,
  containerId = "doorcard-schedule",
}: UnifiedDoorcardProps) {
  const days = DAY_LABELS.filter((d) =>
    showWeekendDays ? true : d.key !== "SATURDAY" && d.key !== "SUNDAY"
  );
  const byDay = groupByDay(doorcard.appointments);

  return (
    <div id={containerId} className="space-y-4">
      <header className="border-b pb-2">
        <h1 className="text-xl font-bold text-red-700">
          {doorcard.user ? formatDisplayName(doorcard.user) : doorcard.name || "Faculty Name"}
        </h1>
        <div className="mt-1 flex flex-wrap gap-x-6 text-xs">
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
                href={doorcard.user.website.startsWith('http') ? doorcard.user.website : `https://${doorcard.user.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Faculty Website
              </a>
            </div>
          )}
        </div>
      </header>

      <div className="overflow-hidden rounded border border-gray-300 bg-white" role="presentation">
        <table className="w-full border-collapse" role="presentation">
          <thead>
            <tr>
              <th className="w-20 p-2 text-xs font-medium">
                Time
              </th>
              {days.map((d) => (
                <th key={d.key} className="p-2 text-center text-xs font-medium">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot) => (
              <tr key={slot.value} className="border-t">
                <td className="p-2 text-center text-[11px] text-gray-600">
                  {slot.label}
                </td>
                {days.map((d) => {
                  const list = byDay[d.key] || [];
                  const active = list.find((a) => a.startTime === slot.value);
                  if (active) {
                    return (
                      <td
                        key={`${d.key}-${slot.value}`}
                        rowSpan={durationRows(active)}
                        className="p-1 align-middle text-center text-xs"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[active.category] ?? "#f0f0f0",
                        }}
                      >
                        <div className="font-semibold">
                          {extractCourseCode(active.name)}
                        </div>
                        <div>
                          {formatTimeRange(active.startTime, active.endTime)}
                        </div>
                        {active.location && (
                          <div className="text-[10px]">{active.location}</div>
                        )}
                      </td>
                    );
                  }
                  if (
                    list.some(
                      (a) =>
                        isSlotCovered(a, slot.value) &&
                        a.startTime !== slot.value
                    )
                  ) {
                    return null;
                  }
                  return <td key={`${d.key}-${slot.value}`} />;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
