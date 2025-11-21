"use client";

import React from "react";
import {
  formatTimeRange,
  TIME_SLOTS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  extractCourseCode,
  calculateAppointmentLayout,
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
          /* Screen styles for grid layout */
          .print-schedule-grid {
            display: flex;
            margin: 12px 0;
            gap: 0;
          }

          .print-time-column {
            width: 80px;
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
            font-size: 10px;
          }

          .print-time-slot {
            height: 30px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 6px;
            font-size: 9px;
            color: #6b7280;
            background-color: #f9fafb !important;
          }

          .print-days-grid {
            flex: 1;
            display: flex;
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
            font-size: 10px;
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
            position: absolute;
            left: 0;
            right: 0;
            padding: 4px;
            font-weight: 600;
            line-height: 1.2;
            word-wrap: break-word;
            text-align: center;
            border-left: 3px solid #1f2937;
            overflow: hidden;
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
            
            .print-schedule-grid, .print-time-column, .print-days-grid, .print-day-column {
              display: flex !important;
            }

            .print-time-column {
              width: ${scheduleData.daySchedules.length > 5 ? "60px" : "80px"} !important;
              font-size: ${scheduleData.daySchedules.length > 5 ? "7px" : "9px"} !important;
            }

            .print-day-content {
              height: 900px !important;
            }

            .print-appointment {
              font-size: ${scheduleData.daySchedules.length > 5 ? "7px" : "9px"} !important;
            }

            .print-time-range {
              font-size: ${scheduleData.daySchedules.length > 5 ? "7px" : "9px"} !important;
            }

            .print-location {
              font-size: ${scheduleData.daySchedules.length > 5 ? "6px" : "8px"} !important;
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

        {/* Grid layout with percentage-based positioning */}
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
            {scheduleData.daySchedules.map((day) => {
              const dayAppointments = byDay[day.dayKey] || [];

              return (
                <div key={day.dayKey} className="print-day-column">
                  <div className="print-day-header">{day.dayLabel}</div>
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
                              CATEGORY_COLORS[appointment.category] ??
                              "#f0f0f0",
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
