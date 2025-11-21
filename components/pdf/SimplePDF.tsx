"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { DoorcardLite } from "../UnifiedDoorcard";
import { formatDisplayName } from "@/lib/display-name";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  TIME_SLOTS,
  ALL_DAYS,
  calculateAppointmentLayout,
} from "@/lib/doorcard-constants";

// Appointment interface for PDF generation
interface AppointmentForPDF {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  category: string;
  location?: string | null;
}

interface SimplePDFProps {
  doorcard: DoorcardLite;
  doorcardId?: string;
  onDownload?: () => void;
}

// Days are now imported from shared constants

function generatePrintableHTML(doorcard: DoorcardLite): string {
  const displayName = doorcard.user
    ? formatDisplayName(doorcard.user)
    : doorcard.name || "Faculty Member";

  // Group appointments by day
  const byDay: Record<string, AppointmentForPDF[]> = {};
  doorcard.appointments.forEach((apt) => {
    if (!byDay[apt.dayOfWeek]) {
      byDay[apt.dayOfWeek] = [];
    }
    byDay[apt.dayOfWeek].push(apt);
  });

  // Auto-detect if weekend appointments exist
  const hasWeekendAppointments = Boolean(
    byDay.SATURDAY?.length || byDay.SUNDAY?.length
  );

  // Show weekends only if weekend appointments exist
  const daysToShow = hasWeekendAppointments ? ALL_DAYS : ALL_DAYS.slice(0, 5);

  // Format time for display
  const formatTime = (time: string) => {
    const [hour, min] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${min.toString().padStart(2, "0")} ${period}`;
  };

  // Get all categories for legend (show all 6)
  const categories = [
    "OFFICE_HOURS",
    "IN_CLASS",
    "LECTURE",
    "LAB",
    "HOURS_BY_ARRANGEMENT",
    "REFERENCE",
  ];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${displayName} - Faculty Doorcard</title>
  <style>
    @page {
      size: letter;
      margin: 0.5in;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #1f2937;
      background: white;
    }
    
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #3b82f6;
    }
    
    .logo {
      font-size: 16px;
      font-weight: bold;
      color: #1f2937;
    }
    
    .term-info {
      font-size: 10px;
      color: #6b7280;
      font-weight: 600;
    }
    
    .faculty-name {
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 4px;
      color: #1f2937;
    }
    
    .faculty-title {
      font-size: 11px;
      text-align: center;
      color: #6b7280;
      margin-bottom: 10px;
    }
    
    .office-info {
      display: flex;
      justify-content: space-around;
      margin-bottom: 12px;
      padding: 8px;
      background: #f8fafc;
      border-radius: 4px;
    }
    
    .office-item {
      text-align: center;
    }
    
    .office-label {
      font-size: 9px;
      color: #6b7280;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    
    .office-value {
      font-size: 12px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .schedule-grid {
      display: flex;
      gap: 0;
      margin-bottom: 8px;
      position: relative;
    }

    .time-column {
      width: 60px;
      border-right: 1px solid #d1d5db;
    }

    .time-header {
      height: 30px;
      background: #3b82f6;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 600;
      border: 1px solid #d1d5db;
    }

    .time-slot {
      height: 30px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 6px;
      font-size: 7px;
      color: #6b7280;
      background: #f9fafb;
    }

    .days-grid {
      flex: 1;
      display: flex;
      gap: 0;
    }

    .day-column {
      flex: 1;
      border-right: 1px solid #d1d5db;
      position: relative;
    }

    .day-header {
      background: #3b82f6;
      color: white;
      padding: 6px 2px;
      font-size: 9px;
      font-weight: 600;
      text-align: center;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 1px solid #d1d5db;
    }

    .day-content {
      position: relative;
      height: 900px;
      border-top: 1px solid #d1d5db;
    }

    .grid-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }

    .grid-line {
      height: 30px;
      border-bottom: 1px solid #e5e7eb;
      background: white;
    }

    .appointment {
      position: absolute;
      left: 0;
      right: 0;
      padding: 3px 4px;
      font-size: 7px;
      font-weight: 600;
      text-align: center;
      line-height: 1.2;
      border-left: 3px solid #1f2937;
      overflow: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .appointment-name {
      font-weight: 600;
      margin-bottom: 2px;
    }

    .appointment-time {
      font-size: 6px;
      opacity: 0.8;
      margin-top: 1px;
    }

    .appointment-location {
      font-size: 6px;
      color: #6b7280;
      margin-top: 1px;
    }
    
    .legend {
      margin-top: 10px;
      padding: 8px;
      background: #f8fafc;
      border-radius: 4px;
    }
    
    .legend-title {
      font-size: 10px;
      font-weight: 600;
      margin-bottom: 6px;
      color: #1f2937;
    }
    
    .legend-items {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
      display: inline-block;
      vertical-align: middle;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .legend-text {
      font-size: 9px;
      color: #4b5563;
    }
    
    .footer {
      position: fixed;
      bottom: 0.3in;
      left: 0.5in;
      right: 0.5in;
      display: flex;
      justify-content: space-between;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      font-size: 8px;
      color: #6b7280;
    }
    
    @media print {
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Faculty Doorcard</div>
    <div class="term-info">${doorcard.term} ${doorcard.year} • ${doorcard.college}</div>
  </div>

  <div class="faculty-name">${displayName}</div>

  <div class="office-info">
    <div class="office-item">
      <div class="office-label">Office</div>
      <div class="office-value">${doorcard.officeNumber || "TBA"}</div>
    </div>
    <div class="office-item">
      <div class="office-label">Campus</div>
      <div class="office-value">${doorcard.college}</div>
    </div>
    ${
      doorcard.user?.website
        ? `
    <div class="office-item">
      <div class="office-label">Website</div>
      <div class="office-value" style="color: #3b82f6; font-size: 10px;">
        ${doorcard.user.website.replace(/^https?:\/\//, "")}
      </div>
    </div>
    `
        : ""
    }
  </div>

  <!-- Screen reader accessible appointment list -->
  <div class="sr-only" aria-label="Appointment Schedule">
    <h2>Weekly Schedule</h2>
    ${daysToShow
      .map((day) => {
        const dayAppointments = byDay[day.key] || [];
        if (dayAppointments.length === 0) return "";

        return `
        <div>
          <h3>${day.label}</h3>
          <ol>
            ${dayAppointments
              .map(
                (appointment) => `
              <li>
                ${appointment.name} from ${appointment.startTime} to ${appointment.endTime}
                ${appointment.location ? ` at ${appointment.location}` : ""}
                , Category: ${CATEGORY_LABELS[appointment.category as keyof typeof CATEGORY_LABELS] || appointment.category}
              </li>
            `
              )
              .join("")}
          </ol>
        </div>
      `;
      })
      .join("")}
  </div>

  <div class="schedule-grid">
    <!-- Time column -->
    <div class="time-column">
      <div class="time-header">Time</div>
      ${TIME_SLOTS.map((slot) => `<div class="time-slot">${slot.label}</div>`).join("")}
    </div>

    <!-- Days grid -->
    <div class="days-grid">
      ${daysToShow
        .map((day) => {
          const dayAppointments = byDay[day.key] || [];

          return `
        <div class="day-column">
          <div class="day-header">${day.label}</div>
          <div class="day-content">
            <!-- Background grid lines -->
            <div class="grid-background">
              ${TIME_SLOTS.map(() => `<div class="grid-line"></div>`).join("")}
            </div>

            <!-- Appointments positioned absolutely -->
            ${dayAppointments
              .map((appointment) => {
                const layout = calculateAppointmentLayout(appointment);
                const heightInPixels = (layout.height / 100) * 900; // 900px = grid height
                const topInPixels = (layout.top / 100) * 900;
                const bgColor =
                  CATEGORY_COLORS[
                    appointment.category as keyof typeof CATEGORY_COLORS
                  ] || CATEGORY_COLORS.REFERENCE;
                const courseName = appointment.name.replace(/^(.*?)\s*-\s*/, "");
                const timeRange = `${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`;

                return `
              <div class="appointment" style="
                top: ${topInPixels}px;
                height: ${Math.max(heightInPixels, 20)}px;
                background-color: ${bgColor};
                color: #1f2937;
              ">
                <div class="appointment-name">${courseName}</div>
                <div class="appointment-time">${timeRange}</div>
                ${appointment.location ? `<div class="appointment-location">${appointment.location}</div>` : ""}
              </div>
            `;
              })
              .join("")}
          </div>
        </div>
      `;
        })
        .join("")}
    </div>
  </div>

  ${
    categories.length > 0
      ? `
  <div class="legend">
    <div class="legend-title">Activity Types</div>
    <div class="legend-items">
      ${categories
        .map((category) => {
          const bgColor =
            CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
            CATEGORY_COLORS.REFERENCE;
          const label =
            CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ||
            category;
          return `
        <div class="legend-item">
          <div class="legend-color" style="background-color: ${bgColor}; width: 12px; height: 12px; border: 1px solid #d1d5db; border-radius: 2px; display: inline-block;"></div>
          <span class="legend-text">${label}</span>
        </div>
      `;
        })
        .join("")}
    </div>
  </div>
  `
      : ""
  }

  <div class="footer">
    <div>Generated from Faculty Doorcard System • ${new Date().toLocaleDateString()}</div>
    <div>San Mateo County Community College District</div>
  </div>
</body>
</html>
  `;
}

export function SimplePDF({ doorcard, onDownload }: SimplePDFProps) {
  const handleDownload = () => {
    onDownload?.();

    // Generate the HTML
    const htmlContent = generatePrintableHTML(doorcard);

    // Create a new window and print
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
    }
  };

  return (
    <Button
      onClick={handleDownload}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      <FileDown className="h-4 w-4 mr-1" />
      Download PDF
    </Button>
  );
}
