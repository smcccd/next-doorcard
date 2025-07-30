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
        a.dayOfWeek
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

function getAllCategories(): AppointmentCategory[] {
  return [
    "OFFICE_HOURS",
    "IN_CLASS",
    "LECTURE",
    "LAB",
    "HOURS_BY_ARRANGEMENT",
    "REFERENCE",
  ] as AppointmentCategory[];
}

export function PrintOptimizedDoorcard({
  doorcard,
  containerId = "doorcard-schedule",
}: PrintOptimizedDoorcardProps) {
  const byDay = groupByDay(doorcard.appointments);
  const allCategories = getAllCategories();

  return (
    <div
      id={containerId}
      className="print-doorcard max-w-[8.5in] mx-auto bg-white p-4 shadow-lg print:shadow-none print:p-0 print:max-h-screen print:overflow-hidden"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page { 
              margin: 0.5in; 
              size: letter; 
            }
            
            /* Force color printing */
            * { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              color-adjust: exact !important;
            }
            
            .print-doorcard { 
              font-size: 12px; 
              line-height: 1.3;
              max-width: 100%;
              margin: 0;
              padding: 0;
            }
            
            .print-header { 
              margin-bottom: 12px; 
              padding-bottom: 8px; 
              border-bottom: 2px solid #dc2626;
            }
            
            .print-header h1 { 
              font-size: 20px; 
              font-weight: bold; 
              color: #dc2626; 
              margin: 0 0 6px 0; 
              line-height: 1.2;
            }
            
            .print-info { 
              font-size: 12px; 
              color: #374151; 
              line-height: 1.4;
            }
            
            .print-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 12px 0; 
              font-size: 11px;
              table-layout: fixed;
            }
            
            .print-table th { 
              background-color: #f3f4f6 !important; 
              border: 1px solid #d1d5db; 
              padding: 6px 4px; 
              text-align: center; 
              font-weight: 600; 
              font-size: 10px;
              height: 30px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .print-table td { 
              border: 1px solid #d1d5db; 
              padding: 4px; 
              text-align: center; 
              font-size: 10px; 
              min-height: 25px; 
              vertical-align: middle;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .print-time-cell { 
              width: 80px; 
              background-color: #f9fafb !important; 
              font-size: 9px; 
              color: #6b7280;
              font-weight: 500;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .print-appointment { 
              font-weight: 600; 
              line-height: 1.2;
              word-wrap: break-word;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .print-time-range { 
              font-size: 9px; 
              opacity: 0.8; 
              margin-top: 2px;
            }
            
            .print-location { 
              font-size: 8px; 
              opacity: 0.7; 
              margin-top: 1px;
            }
            
            .print-legend { 
              margin-top: 12px; 
              font-size: 10px;
            }
            
            .print-legend-item { 
              display: inline-flex !important; 
              align-items: center; 
              margin-right: 12px;
              margin-bottom: 4px;
            }
            
            .print-color-box { 
              display: inline-block !important;
              width: 14px !important; 
              height: 14px !important; 
              border: 1px solid #9ca3af !important; 
              border-radius: 2px !important;
              margin-right: 6px !important;
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important;
            }
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
        {doorcard.user?.title && (
          <div
            style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}
          >
            {doorcard.user.title}
          </div>
        )}
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
                      isSlotCovered(a, slot.value) && a.startTime !== slot.value
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

      {/* Compact Legend - All Categories */}
      <div className="print-legend" style={{ marginTop: "12px" }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: "600",
            marginBottom: "6px",
            color: "#1f2937",
          }}
        >
          Activity Types
        </div>
        <table style={{ borderCollapse: "collapse", fontSize: "10px" }}>
          <tbody>
            <tr>
              {allCategories.slice(0, 3).map((category) => (
                <td
                  key={category}
                  style={{ paddingRight: "16px", paddingBottom: "4px" }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        backgroundColor: CATEGORY_COLORS[category],
                        border: "1px solid #9ca3af",
                        borderRadius: "2px",
                        marginRight: "6px",
                        WebkitPrintColorAdjust: "exact",
                        printColorAdjust: "exact",
                      }}
                    />
                    <span style={{ color: "#4b5563" }}>
                      {CATEGORY_LABELS[category]}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              {allCategories.slice(3, 6).map((category) => (
                <td key={category} style={{ paddingRight: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        backgroundColor: CATEGORY_COLORS[category],
                        border: "1px solid #9ca3af",
                        borderRadius: "2px",
                        marginRight: "6px",
                        WebkitPrintColorAdjust: "exact",
                        printColorAdjust: "exact",
                      }}
                    />
                    <span style={{ color: "#4b5563" }}>
                      {CATEGORY_LABELS[category]}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PrintOptimizedDoorcard;
