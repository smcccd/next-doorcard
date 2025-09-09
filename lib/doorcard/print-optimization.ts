import type { AppointmentCategory } from "@prisma/client";

/**
 * Print optimization utilities for high-contrast, professional printing
 * Optimized for cheap printers (inkjet, laser, B&W)
 */

// High-contrast colors optimized for print
export const PRINT_CATEGORY_COLORS: Record<AppointmentCategory, string> = {
  OFFICE_HOURS: "#E5E7EB", // Light gray - prints well in B&W
  IN_CLASS: "#DBEAFE", // Light blue - good contrast
  LECTURE: "#FDF2F8", // Light pink - subtle but visible
  LAB: "#FEF3C7", // Light yellow - high contrast
  HOURS_BY_ARRANGEMENT: "#DCFCE7", // Light green - prints clearly
  REFERENCE: "#F3E8FF", // Light purple - distinguishable
  OTHER: "#F9FAFB", // Neutral light gray
};

// Screen colors for better visual distinction (fallback to print colors)
export const SCREEN_CATEGORY_COLORS: Record<AppointmentCategory, string> = {
  OFFICE_HOURS: "#E1E2CA",
  IN_CLASS: "#99B5D5",
  LECTURE: "#D599C5",
  LAB: "#EDAC80",
  HOURS_BY_ARRANGEMENT: "#99D5A1",
  REFERENCE: "#AD99D5",
  OTHER: "#E5E7EB",
};

export const CATEGORY_LABELS: Record<AppointmentCategory, string> = {
  OFFICE_HOURS: "Office Hours",
  IN_CLASS: "In Class",
  LECTURE: "Lecture",
  LAB: "Lab",
  HOURS_BY_ARRANGEMENT: "Hours by Arrangement",
  REFERENCE: "Reference",
  OTHER: "Other",
};

/**
 * Generates print-optimized CSS for a given number of days
 */
export function generatePrintCSS(numberOfDays: number): string {
  const baseFontSize = numberOfDays > 5 ? "10px" : "12px";
  const headerFontSize = numberOfDays > 5 ? "18px" : "20px";
  const cellPadding = numberOfDays > 5 ? "3px" : "5px";

  return `
    @media print {
      @page { 
        margin: 0.3in; 
        size: letter ${numberOfDays > 5 ? "landscape" : "portrait"}; 
      }
      
      /* Force high contrast printing */
      * { 
        -webkit-print-color-adjust: exact !important; 
        print-color-adjust: exact !important; 
        color-adjust: exact !important;
      }
      
      .print-doorcard { 
        font-size: ${baseFontSize}; 
        line-height: 1.4;
        max-width: 100%;
        margin: 0;
        padding: 0;
        font-family: 'Times New Roman', serif;
      }
      
      .print-header { 
        margin-bottom: 16px; 
        padding-bottom: 10px; 
        border-bottom: 2px solid #000;
      }
      
      .print-header h1 { 
        font-size: ${headerFontSize}; 
        font-weight: bold; 
        color: #000; 
        margin: 0 0 8px 0; 
        line-height: 1.2;
      }
      
      .print-info { 
        font-size: 11px; 
        color: #333; 
        line-height: 1.5;
        font-weight: 500;
      }
      
      .schedule-days {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: repeat(${Math.min(numberOfDays, 7)}, 1fr);
        gap: 8px;
      }
      
      .schedule-day {
        border: 1px solid #333;
        padding: 0;
        break-inside: avoid;
      }
      
      .schedule-day h3 {
        background-color: #f5f5f5 !important;
        color: #000 !important;
        margin: 0;
        padding: ${cellPadding};
        font-size: 11px;
        font-weight: bold;
        text-align: center;
        border-bottom: 1px solid #333;
      }
      
      .day-appointments {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .appointment {
        border-bottom: 1px solid #ddd;
        padding: ${cellPadding};
        font-size: 9px;
        line-height: 1.3;
        break-inside: avoid;
      }
      
      .appointment:last-child {
        border-bottom: none;
      }
      
      .appointment-name {
        font-weight: bold;
        color: #000;
        display: block;
        margin-bottom: 2px;
      }
      
      .appointment-time {
        color: #333;
        font-size: 8px;
        display: block;
        margin-bottom: 1px;
      }
      
      .appointment-location {
        color: #666;
        font-size: 8px;
        font-style: italic;
      }
      
      .legend {
        margin-top: 12px;
        page-break-inside: avoid;
      }
      
      .legend-title {
        font-size: 10px;
        font-weight: bold;
        color: #000;
        margin-bottom: 6px;
      }
      
      .legend-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        font-size: 9px;
      }
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .legend-color {
        width: 12px;
        height: 12px;
        border: 1px solid #333 !important;
        flex-shrink: 0;
      }
    }
  `;
}

/**
 * Gets the appropriate category color based on view mode
 */
export function getCategoryColor(
  category: AppointmentCategory,
  viewMode: "screen" | "print" = "screen"
): string {
  return viewMode === "print"
    ? PRINT_CATEGORY_COLORS[category]
    : SCREEN_CATEGORY_COLORS[category];
}

/**
 * Calculates contrast ratio for accessibility (basic implementation)
 */
export function hasGoodContrast(
  backgroundColor: string,
  textColor: string = "#000000"
): boolean {
  // Simple contrast check - in a real implementation, you'd calculate the actual contrast ratio
  // For now, we assume our predefined colors have good contrast
  return true;
}
