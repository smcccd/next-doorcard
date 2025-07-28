"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { DoorcardLite } from "../UnifiedDoorcard";
import { formatDisplayName } from "@/lib/display-name";

interface SimplePDFProps {
  doorcard: DoorcardLite;
  doorcardId?: string;
  onDownload?: () => void;
}

// Category colors and labels
const CATEGORY_COLORS = {
  OFFICE_HOURS: '#3b82f6',
  CLASS: '#10b981',
  MEETING: '#8b5cf6',
  RESEARCH: '#f59e0b',
  OTHER: '#6b7280',
};

const CATEGORY_LABELS = {
  OFFICE_HOURS: 'Office Hours',
  CLASS: 'Class',
  MEETING: 'Meeting',
  RESEARCH: 'Research',
  OTHER: 'Other',
};

const DAYS = [
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
];

// Generate time slots from 7 AM to 9 PM
const TIME_SLOTS = Array.from({ length: 29 }, (_, i) => {
  const hour = Math.floor(7 + i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const time24 = `${hour.toString().padStart(2, '0')}:${minute}`;
  const display = hour > 12 ? `${hour - 12}:${minute} PM` : 
                 hour === 12 ? `12:${minute} PM` : 
                 `${hour}:${minute} AM`;
  return { time24, display };
});

function generatePrintableHTML(doorcard: DoorcardLite): string {
  const displayName = formatDisplayName(doorcard.user);
  
  // Group appointments by day
  const byDay: Record<string, any[]> = {};
  doorcard.appointments.forEach(apt => {
    if (!byDay[apt.dayOfWeek]) {
      byDay[apt.dayOfWeek] = [];
    }
    byDay[apt.dayOfWeek].push(apt);
  });

  // Helper to calculate rowspan for appointments
  const getRowspan = (appointment: any) => {
    const [startHour, startMin] = appointment.startTime.split(':').map(Number);
    const [endHour, endMin] = appointment.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const durationMinutes = endMinutes - startMinutes;
    
    return Math.ceil(durationMinutes / 30); // Each slot is 30 minutes
  };

  // Helper to check if this is the start of an appointment
  const isAppointmentStart = (appointment: any, slot: string) => {
    return appointment.startTime === slot;
  };

  // Helper to check if appointment covers time slot
  const isSlotCovered = (appointment: any, slot: string) => {
    const [slotHour, slotMin] = slot.split(':').map(Number);
    const [startHour, startMin] = appointment.startTime.split(':').map(Number);
    const [endHour, endMin] = appointment.endTime.split(':').map(Number);
    
    const slotMinutes = slotHour * 60 + slotMin;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
  };

  // Get unique categories for legend
  const categories = [...new Set(doorcard.appointments.map(apt => apt.category))];

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
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #1f2937;
      background: white;
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
    
    /* Category-specific colors - matching your request */
    .appointment.office-hours {
      background: #dbeafe !important;
      color: #1e40af !important;
    }
    
    .appointment.class {
      background: #dcfce7 !important;
      color: #166534 !important;
    }
    
    .appointment.meeting {
      background: #f3e8ff !important;
      color: #7c2d12 !important;
    }
    
    .appointment.research {
      background: #fed7aa !important;
      color: #ea580c !important;
    }
    
    .appointment.other {
      background: #f3f4f6 !important;
      color: #374151 !important;
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
      width: 10px;
      height: 10px;
      border-radius: 2px;
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
  ${doorcard.user?.title ? `<div class="faculty-title">${doorcard.user.title}</div>` : ''}

  <div class="office-info">
    <div class="office-item">
      <div class="office-label">Office</div>
      <div class="office-value">${doorcard.officeNumber || 'TBA'}</div>
    </div>
    <div class="office-item">
      <div class="office-label">Campus</div>
      <div class="office-value">${doorcard.college}</div>
    </div>
    ${doorcard.user?.website ? `
    <div class="office-item">
      <div class="office-label">Website</div>
      <div class="office-value" style="color: #3b82f6; font-size: 10px;">
        ${doorcard.user.website.replace(/^https?:\/\//, '')}
      </div>
    </div>
    ` : ''}
  </div>

  <table class="schedule-table">
    <thead>
      <tr>
        <th class="time-cell">Time</th>
        ${DAYS.map(day => `<th class="day-header">${day.label}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${TIME_SLOTS.map((slot, index) => {
        // Only show time labels every hour for cleaner look
        const showTime = index % 2 === 0;
        
        let html = `<tr>`;
        
        // Time cell
        html += `<td class="time-cell">${showTime ? slot.display : ''}</td>`;
        
        // Day columns
        DAYS.forEach(day => {
          const appointment = byDay[day.key]?.find(apt => isSlotCovered(apt, slot.time24));
          
          if (appointment && isAppointmentStart(appointment, slot.time24)) {
            // This is the start of an appointment - create cell with rowspan
            const rowspan = getRowspan(appointment);
            const categoryClass = appointment.category.toLowerCase().replace('_', '-');
            html += `
              <td rowspan="${rowspan}" class="appointment ${categoryClass}">
                ${appointment.name}
                ${appointment.location ? `<br><span class="appointment-location">${appointment.location}</span>` : ''}
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
      }).join('')}
    </tbody>
  </table>

  ${categories.length > 0 ? `
  <div class="legend">
    <div class="legend-title">Activity Types</div>
    <div class="legend-items">
      ${categories.map(category => {
        const colorMap = {
          'OFFICE_HOURS': '#dbeafe',
          'CLASS': '#dcfce7', 
          'MEETING': '#f3e8ff',
          'RESEARCH': '#fed7aa',
          'OTHER': '#f3f4f6'
        };
        const textColorMap = {
          'OFFICE_HOURS': '#1e40af',
          'CLASS': '#166534', 
          'MEETING': '#7c2d12',
          'RESEARCH': '#ea580c',
          'OTHER': '#374151'
        };
        const bgColor = colorMap[category as keyof typeof colorMap] || colorMap.OTHER;
        const textColor = textColorMap[category as keyof typeof textColorMap] || textColorMap.OTHER;
        return `
        <div class="legend-item">
          <div class="legend-color" style="background-color: ${bgColor}; border: 1px solid #d1d5db; color: ${textColor}; padding: 2px 4px; font-size: 7px; font-weight: 600;">${CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}</div>
        </div>
      `;
      }).join('')}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <div>Generated from Faculty Doorcard System • ${new Date().toLocaleDateString()}</div>
    <div>San Mateo County Community College District</div>
  </div>
</body>
</html>
  `;
}

export function SimplePDF({ doorcard, doorcardId, onDownload }: SimplePDFProps) {
  const handleDownload = () => {
    onDownload?.();
    
    // Generate the HTML
    const htmlContent = generatePrintableHTML(doorcard);
    
    // Create a new window and print
    const printWindow = window.open('', '_blank');
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
    <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white">
      <FileDown className="h-4 w-4 mr-1" />
      Download PDF
    </Button>
  );
}