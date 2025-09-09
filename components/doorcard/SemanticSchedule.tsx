"use client";

import React from "react";
import {
  formatTimeRange,
  TIME_SLOTS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  extractCourseCode,
} from "@/lib/doorcard-constants";
import {
  createSemanticScheduleData,
  generateSemanticIds,
  groupAppointmentsByDay,
} from "@/lib/doorcard/semantic-structure";
import { generatePrintCSS } from "@/lib/doorcard/print-optimization";
import { generateScreenReaderContent } from "@/lib/doorcard/accessibility";
import type {
  DoorcardLite,
  ViewMode,
  AppointmentLite,
} from "@/lib/doorcard/types";
import type { DayOfWeek } from "@prisma/client";

interface SemanticScheduleProps {
  doorcard: DoorcardLite;
  viewMode?: ViewMode;
  showWeekends?: boolean;
  containerId?: string;
}

// Helper functions from original PrintOptimizedDoorcard
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

/**
 * ADA-compliant component that renders the EXACT table layout for printing
 * but with semantic accessibility enhancements
 */
export function SemanticSchedule({
  doorcard,
  viewMode = "screen",
  showWeekends = false,
  containerId = "semantic-schedule",
}: SemanticScheduleProps) {
  const scheduleData = createSemanticScheduleData(doorcard, showWeekends);
  const semanticIds = generateSemanticIds(containerId);
  const screenReaderContent = generateScreenReaderContent(scheduleData);
  const byDay = groupAppointmentsByDay(doorcard.appointments);

  // Use original TIME_SLOTS for table-based rendering
  const PRINT_TIME_SLOTS = TIME_SLOTS;

  // Generate print CSS that produces the ORIGINAL table layout
  const printCSS = generatePrintCSS(scheduleData.daySchedules.length);

  return (
    <div id={containerId} className="semantic-schedule">
      {/* Enhanced Print CSS that maintains original table appearance */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* Screen styles to match print layout */
          .print-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 12px 0; 
            font-size: 11px;
            table-layout: auto;
          }
          
          .print-table th { 
            background-color: #f3f4f6 !important; 
            border: 1px solid #d1d5db; 
            padding: 6px 4px; 
            text-align: center; 
            font-weight: 600; 
            font-size: 10px;
            height: 30px;
          }
          
          .print-table td { 
            border: 1px solid #d1d5db; 
            padding: 4px; 
            text-align: center; 
            font-size: 10px; 
            min-height: 25px; 
            vertical-align: middle;
          }
          
          .print-time-cell { 
            width: 80px; 
            background-color: #f9fafb !important; 
            font-size: 9px; 
            color: #6b7280;
            font-weight: 500;
          }
          
          .print-appointment { 
            font-weight: 600; 
            line-height: 1.2;
            word-wrap: break-word;
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
          
          @media print {
            @page { 
              margin: 0.3in; 
              size: letter ${scheduleData.daySchedules.length > 5 ? "landscape" : "portrait"}; 
            }
            
            /* Force color printing */
            * { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              color-adjust: exact !important;
            }
            
            .print-doorcard { 
              font-size: ${scheduleData.daySchedules.length > 5 ? "10px" : "12px"}; 
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
              font-size: ${scheduleData.daySchedules.length > 5 ? "18px" : "20px"}; 
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
              font-size: ${scheduleData.daySchedules.length > 5 ? "9px" : "11px"};
              table-layout: auto;
            }
            
            .print-table th { 
              background-color: #f3f4f6 !important; 
              border: 1px solid #d1d5db; 
              padding: ${scheduleData.daySchedules.length > 5 ? "4px 2px" : "6px 4px"}; 
              text-align: center; 
              font-weight: 600; 
              font-size: ${scheduleData.daySchedules.length > 5 ? "8px" : "10px"};
              height: ${scheduleData.daySchedules.length > 5 ? "25px" : "30px"};
            }
            
            .print-table td { 
              border: 1px solid #d1d5db; 
              padding: ${scheduleData.daySchedules.length > 5 ? "2px" : "4px"}; 
              text-align: center; 
              font-size: ${scheduleData.daySchedules.length > 5 ? "8px" : "10px"}; 
              min-height: ${scheduleData.daySchedules.length > 5 ? "20px" : "25px"}; 
              vertical-align: middle;
            }
            
            .print-time-cell { 
              width: ${scheduleData.daySchedules.length > 5 ? "60px" : "80px"}; 
              background-color: #f9fafb !important; 
              font-size: ${scheduleData.daySchedules.length > 5 ? "7px" : "9px"}; 
              color: #6b7280;
              font-weight: 500;
            }
            
            .print-appointment { 
              font-weight: 600; 
              line-height: 1.2;
              word-wrap: break-word;
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
          }
        `,
        }}
      />

      <article
        className="print-doorcard"
        aria-labelledby={semanticIds.scheduleTitle}
        aria-describedby={`${containerId}-description`}
      >
        {/* Screen Reader Content - Hidden but accessible */}
        <div
          id={`${containerId}-description`}
          className="sr-only"
          aria-live="polite"
        >
          {screenReaderContent.scheduleDescription}
        </div>

        {/* Screen reader accessible schedule list */}
        <div className="sr-only" aria-label="Complete Schedule Listing">
          <h2>Detailed Schedule for {scheduleData.facultyName}</h2>
          {screenReaderContent.dayDescriptions.map((day) => (
            <div key={day.dayLabel}>
              <h3>{day.dayLabel}</h3>
              <ol>
                {day.appointments.map((appointment, index) => (
                  <li key={index} aria-label={appointment.ariaLabel}>
                    {appointment.name}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* Professional Header - EXACT same as original */}
        <header className="print-header">
          <h1 id={semanticIds.scheduleTitle}>{scheduleData.facultyName}</h1>
          {doorcard.user?.title && (
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              {doorcard.user.title}
            </div>
          )}
          <div className="print-info">
            <strong>{scheduleData.semesterInfo}</strong> • Office:{" "}
            {scheduleData.officeInfo}
            {doorcard.college && <span> • {doorcard.college}</span>}
            {scheduleData.website && (
              <span> • {scheduleData.website.replace(/^https?:\/\//, "")}</span>
            )}
          </div>
        </header>

        {/* ORIGINAL TABLE STRUCTURE - exactly as before */}
        <table className="print-table" aria-hidden="true">
          <thead>
            <tr>
              <th className="print-time-cell">Time</th>
              {scheduleData.daySchedules.map((day) => (
                <th key={day.dayKey}>{day.dayLabel}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRINT_TIME_SLOTS.map((slot) => (
              <tr key={slot.value}>
                <td className="print-time-cell">{slot.label}</td>
                {scheduleData.daySchedules.map((day) => {
                  const list = byDay[day.dayKey] || [];
                  const active = list.find((a) => a.startTime === slot.value);
                  if (active) {
                    return (
                      <td
                        key={`${day.dayKey}-${slot.value}`}
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
                          <div className="print-location">
                            {active.location}
                          </div>
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
                  return <td key={`${day.dayKey}-${slot.value}`} />;
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* ORIGINAL Legend - exactly as before */}
        <div style={{ marginTop: "12px" }}>
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
              fontSize: "10px",
            }}
          >
            {Object.entries(CATEGORY_LABELS).map(([categoryKey, label]) => (
              <div
                key={categoryKey}
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    backgroundColor:
                      CATEGORY_COLORS[
                        categoryKey as keyof typeof CATEGORY_COLORS
                      ],
                    border: "1px solid #9ca3af",
                    borderRadius: "2px",
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                />
                <span style={{ color: "#4b5563" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}

export default SemanticSchedule;
