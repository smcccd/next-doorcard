// Print-optimized version for single-page office door posting
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  formatTimeRange,
  extractCourseCode,
} from "@/lib/doorcard-constants";
import { formatDisplayName } from "@/lib/display-name";
import type { AppointmentCategory, DayOfWeek } from "@prisma/client";
import type {
  AppointmentLite,
  DoorcardLite,
} from "@/components/UnifiedDoorcard";

// Compact time slots for print (8 AM to 6 PM, 30-min intervals)
const PRINT_TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const minute = i % 2 === 0 ? "00" : "30";
  const value = `${hour.toString().padStart(2, "0")}:${minute}`;
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const period = hour >= 12 ? "PM" : "AM";
  const label = `${displayHour}:${minute} ${period}`;
  return { value, label };
});

// Weekdays only for office hours
const WEEKDAYS: { key: DayOfWeek; label: string }[] = [
  { key: "MONDAY", label: "Monday" },
  { key: "TUESDAY", label: "Tuesday" },
  { key: "WEDNESDAY", label: "Wednesday" },
  { key: "THURSDAY", label: "Thursday" },
  { key: "FRIDAY", label: "Friday" },
];

interface PrintOptimizedDoorcardProps {
  doorcard: DoorcardLite;
  containerId?: string;
}

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
    // Only include weekday appointments in print view
    if (
      ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"].includes(
        a.dayOfWeek,
      )
    ) {
      (map[a.dayOfWeek] ||= []).push(a);
    }
  }
  for (const list of Object.values(map)) {
    list.sort((x, y) => x.startTime.localeCompare(y.startTime));
  }
  return map;
}

function getUsedCategories(
  appointments: AppointmentLite[],
): AppointmentCategory[] {
  const used = new Set<AppointmentCategory>();
  appointments.forEach((apt) => used.add(apt.category));
  return Array.from(used);
}

export function PrintOptimizedDoorcard({
  doorcard,
  containerId = "doorcard-schedule",
}: PrintOptimizedDoorcardProps) {
  const byDay = groupByDay(doorcard.appointments);
  const usedCategories = getUsedCategories(doorcard.appointments);

  return (
    <div
      id={containerId}
      className="print-doorcard max-w-[8.5in] mx-auto bg-white p-4 shadow-lg print:shadow-none print:p-0 print:max-h-screen print:overflow-hidden"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            .print-doorcard { font-size: 11px; line-height: 1.2; }
            .print-header { margin-bottom: 8px; padding-bottom: 6px; border-bottom: 2px solid #dc2626; }
            .print-header h1 { font-size: 18px; font-weight: bold; color: #dc2626; margin: 0 0 4px 0; }
            .print-info { font-size: 11px; color: #374151; }
            .print-table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 10px; }
            .print-table th { background-color: #f3f4f6; border: 1px solid #d1d5db; padding: 4px 2px; text-align: center; font-weight: 600; font-size: 9px; }
            .print-table td { border: 1px solid #d1d5db; padding: 2px; text-align: center; font-size: 9px; min-height: 20px; vertical-align: middle; }
            .print-time-cell { width: 60px; background-color: #f9fafb; font-size: 8px; color: #6b7280; }
            .print-appointment { font-weight: 600; line-height: 1.1; }
            .print-time-range { font-size: 8px; opacity: 0.8; }
            .print-location { font-size: 7px; opacity: 0.7; }
            .print-legend { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px; font-size: 9px; }
            .print-legend-item { display: flex; align-items: center; gap: 4px; }
            .print-color-box { width: 12px; height: 12px; border: 1px solid #9ca3af; border-radius: 2px; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 0.5in; size: letter; }
          }
        `,
        }}
      />

      {/* Compact Header */}
      <header className="print-header">
        <h1>
          {doorcard.user
            ? formatDisplayName(doorcard.user)
            : doorcard.name || "Faculty Name"}
        </h1>
        <div className="print-info">
          <strong>
            {doorcard.term} {doorcard.year}
          </strong>{" "}
          • Office: {doorcard.officeNumber}
          {doorcard.college && <span> • {doorcard.college}</span>}
          {doorcard.user?.website && (
            <span> • {doorcard.user.website.replace(/^https?:\/\//, "")}</span>
          )}
        </div>
      </header>

      {/* Compact Schedule Table */}
      <table className="print-table">
        <thead>
          <tr>
            <th className="print-time-cell">Time</th>
            {WEEKDAYS.map((d) => (
              <th key={d.key}>{d.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PRINT_TIME_SLOTS.map((slot) => (
            <tr key={slot.value}>
              <td className="print-time-cell">{slot.label}</td>
              {WEEKDAYS.map((d) => {
                const list = byDay[d.key] || [];
                const active = list.find((a) => a.startTime === slot.value);
                if (active) {
                  return (
                    <td
                      key={`${d.key}-${slot.value}`}
                      rowSpan={durationRows(active)}
                      style={{
                        backgroundColor:
                          CATEGORY_COLORS[active.category] ?? "#f0f0f0",
                      }}
                    >
                      <div className="print-appointment">
                        {extractCourseCode(active.name)}
                      </div>
                      <div className="print-time-range">
                        {formatTimeRange(active.startTime, active.endTime)}
                      </div>
                      {active.location && (
                        <div className="print-location">{active.location}</div>
                      )}
                    </td>
                  );
                }
                if (
                  list.some(
                    (a) =>
                      isSlotCovered(a, slot.value) &&
                      a.startTime !== slot.value,
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

      {/* Compact Legend - Only Used Categories */}
      {usedCategories.length > 0 && (
        <div className="print-legend">
          {usedCategories.map((category) => (
            <div key={category} className="print-legend-item">
              <span
                className="print-color-box"
                style={{
                  backgroundColor: CATEGORY_COLORS[category],
                }}
              />
              {CATEGORY_LABELS[category]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PrintOptimizedDoorcard;
