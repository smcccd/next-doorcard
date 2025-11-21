// Print-optimized version for single-page office door posting
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  formatTimeRange,
  extractCourseCode,
  ALL_DAYS,
  calculateAppointmentLayout,
  TIME_SLOTS,
} from "@/lib/doorcard-constants";
import { formatDisplayName } from "@/lib/display-name";
import type { AppointmentCategory, DayOfWeek } from "@prisma/client";
import type {
  AppointmentLite,
  DoorcardLite,
} from "@/components/UnifiedDoorcard";

// Use centralized TIME_SLOTS from doorcard-constants
const PRINT_TIME_SLOTS = TIME_SLOTS;

interface PrintOptimizedDoorcardProps {
  doorcard: DoorcardLite;
  containerId?: string;
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

  // Auto-detect if weekend appointments exist
  const hasWeekendAppointments = Boolean(
    byDay.SATURDAY?.length || byDay.SUNDAY?.length
  );

  // Show weekends only if weekend appointments exist
  const daysToShow = hasWeekendAppointments ? ALL_DAYS : ALL_DAYS.slice(0, 5);

  return (
    <div
      id={containerId}
      className="print-doorcard mx-auto bg-white p-4 shadow-lg print:shadow-none print:p-0 print:max-h-screen print:overflow-hidden"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page { 
              margin: 0.3in; 
              size: letter landscape; 
            }
            
            /* Force color printing */
            * { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              color-adjust: exact !important;
            }
            
            .print-doorcard { 
              font-size: ${daysToShow.length > 5 ? "10px" : "12px"}; 
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
              font-size: ${daysToShow.length > 5 ? "18px" : "20px"}; 
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
            
            .print-schedule-grid {
              display: flex !important;
              margin: 12px 0;
              gap: 0;
            }

            .print-time-column {
              width: ${daysToShow.length > 5 ? "60px" : "80px"} !important;
              border-right: 1px solid #d1d5db;
            }

            .print-time-header {
              height: 30px;
              background-color: #f3f4f6 !important;
              border: 1px solid #d1d5db;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 600;
              font-size: ${daysToShow.length > 5 ? "8px" : "10px"};
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .print-time-slot {
              height: 30px;
              border-bottom: 1px solid #e5e7eb;
              display: flex;
              align-items: center;
              justify-content: flex-end;
              padding-right: 6px;
              font-size: ${daysToShow.length > 5 ? "7px" : "9px"};
              color: #6b7280;
              background-color: #f9fafb !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .print-days-grid {
              flex: 1;
              display: flex !important;
              gap: 0;
            }

            .print-day-column {
              flex: 1;
              border-right: 1px solid #d1d5db;
              position: relative;
            }

            .print-day-header {
              height: 30px;
              background-color: #f3f4f6 !important;
              border-bottom: 1px solid #d1d5db;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 600;
              font-size: ${daysToShow.length > 5 ? "8px" : "10px"};
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .print-day-content {
              position: relative;
              height: 900px;
            }

            .print-grid-line {
              height: 30px;
              border-bottom: 1px solid #e5e7eb;
              background: white;
            }

            .print-appointment {
              position: absolute !important;
              left: 0;
              right: 0;
              padding: ${daysToShow.length > 5 ? "2px" : "4px"};
              font-weight: 600;
              line-height: 1.2;
              word-wrap: break-word;
              text-align: center;
              border-left: 3px solid #1f2937;
              overflow: hidden;
              font-size: ${daysToShow.length > 5 ? "8px" : "10px"};
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .print-time-range {
              font-size: ${daysToShow.length > 5 ? "7px" : "9px"};
              opacity: 0.8;
              margin-top: 2px;
            }

            .print-location {
              font-size: ${daysToShow.length > 5 ? "6px" : "8px"};
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

      {/* Screen reader accessible appointment list */}
      <div className="sr-only" aria-label="Appointment Schedule">
        <h2>Weekly Schedule</h2>
        {daysToShow.map((day) => {
          const dayAppointments = byDay[day.key] || [];
          if (dayAppointments.length === 0) return null;

          return (
            <div key={day.key}>
              <h3>{day.label}</h3>
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

      {/* Compact Schedule Grid with Percentage-Based Positioning */}
      <div className="print-schedule-grid">
        {/* Time column */}
        <div className="print-time-column">
          <div className="print-time-header">Time</div>
          {PRINT_TIME_SLOTS.map((slot) => (
            <div key={slot.value} className="print-time-slot">
              {slot.label}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="print-days-grid">
          {daysToShow.map((day) => {
            const dayAppointments = byDay[day.key] || [];

            return (
              <div key={day.key} className="print-day-column">
                <div className="print-day-header">{day.label}</div>
                <div className="print-day-content">
                  {/* Background grid lines */}
                  {PRINT_TIME_SLOTS.map((slot) => (
                    <div key={slot.value} className="print-grid-line" />
                  ))}

                  {/* Appointments positioned absolutely */}
                  {dayAppointments.map((appointment) => {
                    const layout = calculateAppointmentLayout(appointment);
                    const heightInPixels = (layout.height / 100) * 900;
                    const topInPixels = (layout.top / 100) * 900;

                    return (
                      <div
                        key={appointment.id}
                        className="print-appointment"
                        style={{
                          top: `${topInPixels}px`,
                          height: `${Math.max(heightInPixels, 20)}px`,
                          backgroundColor:
                            CATEGORY_COLORS[appointment.category] ?? "#f0f0f0",
                        }}
                      >
                        <div>{extractCourseCode(appointment.name)}</div>
                        <div className="print-time-range">
                          {formatTimeRange(
                            appointment.startTime,
                            appointment.endTime
                          )}
                        </div>
                        {appointment.location && (
                          <div className="print-location">
                            {appointment.location}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
