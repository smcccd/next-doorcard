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

  // Helper to calculate rowspan for appointments
  const getRowspan = (appointment: AppointmentForPDF) => {
    const [startHour, startMin] = appointment.startTime.split(":").map(Number);
    const [endHour, endMin] = appointment.endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const durationMinutes = endMinutes - startMinutes;

    return Math.ceil(durationMinutes / 30); // Each slot is 30 minutes
  };

  // Helper to check if this is the start of an appointment
  const isAppointmentStart = (appointment: AppointmentForPDF, slot: string) => {
    return appointment.startTime === slot;
  };

  // Helper to check if appointment covers time slot
  const isSlotCovered = (appointment: AppointmentForPDF, slot: string) => {
    const [slotHour, slotMin] = slot.split(":").map(Number);
    const [startHour, startMin] = appointment.startTime.split(":").map(Number);
    const [endHour, endMin] = appointment.endTime.split(":").map(Number);

    const slotMinutes = slotHour * 60 + slotMin;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
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
    
    .schedule-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 9px;
    }
    
    .schedule-table th,
    .schedule-table td {
      border: 1px solid #d1d5db;
      padding: 1px 2px;
      text-align: center;
      vertical-align: middle;
    }
    
    .time-cell {
      width: 50px;
      font-size: 7px;
      color: #6b7280;
      background: #f9fafb;
      text-align: right;
      padding-right: 4px;
    }
    
    .day-header {
      background: #3b82f6;
      color: white;
      padding: 3px 2px;
      font-size: 9px;
      font-weight: 600;
      width: 18%;
    }
    
    .empty-slot {
      height: 12px;
      background: white;
    }
    
    .appointment {
      padding: 1px 3px;
      font-size: 7px;
      font-weight: 600;
      text-align: center;
      line-height: 1.2;
    }
    
    .appointment-location {
      font-size: 6px;
      opacity: 0.8;
      margin-top: 1px;
    }
    
    /* Category-specific colors - matching centralized constants */
    .appointment {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
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

  <table class="schedule-table" aria-hidden="true">
    <thead>
      <tr>
        <th class="time-cell">Time</th>
        ${daysToShow.map((day) => `<th class="day-header">${day.label}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${TIME_SLOTS.map((slot, index) => {
        // Only show time labels every hour for cleaner look
        const showTime = index % 2 === 0;

        let html = `<tr>`;

        // Time cell
        html += `<td class="time-cell">${showTime ? slot.label : ""}</td>`;

        // Day columns
        daysToShow.forEach((day) => {
          const appointment = byDay[day.key]?.find((apt) =>
            isSlotCovered(apt, slot.value)
          );

          if (appointment && isAppointmentStart(appointment, slot.value)) {
            // This is the start of an appointment - create cell with rowspan
            const rowspan = getRowspan(appointment);
            const bgColor =
              CATEGORY_COLORS[
                appointment.category as keyof typeof CATEGORY_COLORS
              ] || CATEGORY_COLORS.REFERENCE;

            // Extract course code from appointment name
            const courseName = appointment.name.replace(/^(.*?)\s*-\s*/, "");

            // Format time range
            const formatTime = (time: string) => {
              const [hour, min] = time.split(":").map(Number);
              const period = hour >= 12 ? "PM" : "AM";
              const displayHour =
                hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
              return `${displayHour}:${min.toString().padStart(2, "0")} ${period}`;
            };
            const timeRange = `${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`;

            html += `
              <td rowspan="${rowspan}" class="appointment" style="background-color: ${bgColor}; color: #1f2937; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                <div style="font-weight: 600;">${courseName}</div>
                <div style="font-size: 6px; opacity: 0.8; margin-top: 1px;">${timeRange}</div>
                ${appointment.location ? `<div style="font-size: 6px; opacity: 0.7;">${appointment.location}</div>` : ""}
              </td>
            `;
          } else if (!appointment) {
            // Empty slot
            html += `<td class="empty-slot"></td>`;
          }
          // If appointment exists but is not the start, we don't add a cell (covered by rowspan)
        });

        html += `</tr>`;
        return html;
      }).join("")}
    </tbody>
  </table>

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
