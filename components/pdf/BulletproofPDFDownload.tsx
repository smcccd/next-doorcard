"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, AlertCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DoorcardLite } from "../UnifiedDoorcard";
import { analytics } from "@/lib/analytics";
import { formatDisplayName } from "@/lib/display-name";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  TIME_SLOTS,
  WEEKDAYS_ONLY,
  calculateAppointmentLayout,
} from "@/lib/doorcard-constants";

type PDFState =
  | "idle"
  | "loading"
  | "generating"
  | "downloading"
  | "error"
  | "fallback";

interface BulletproofPDFDownloadProps {
  doorcard: DoorcardLite;
  doorcardId?: string;
  className?: string;
}

// Enum for download methods with explicit priority
enum DownloadMethod {
  REACT_PDF = "react-pdf",
  BLOB_DOWNLOAD = "blob-download",
  PRINT_FALLBACK = "print-fallback",
  MANUAL_FALLBACK = "manual-fallback",
}

// Browser detection utility
function getBrowserInfo() {
  if (typeof window === "undefined")
    return { name: "unknown", version: "unknown" };

  const userAgent = navigator.userAgent;
  const isFirefox = /Firefox\/([\d.]+)/i.test(userAgent);
  const isIE = /MSIE|Trident/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  const isChrome = /Chrome/i.test(userAgent);
  const isEdge = /Edg/i.test(userAgent);

  return {
    name: isFirefox
      ? "firefox"
      : isIE
        ? "ie"
        : isSafari
          ? "safari"
          : isChrome
            ? "chrome"
            : isEdge
              ? "edge"
              : "unknown",
    isFirefox,
    isIE,
    isSafari,
    isChrome,
    isEdge,
    supportsDownload: !isIE && "download" in document.createElement("a"),
  };
}

// Enhanced HTML generation for better fallback
function generateEnhancedHTML(doorcard: DoorcardLite): string {
  const displayName = doorcard.user
    ? formatDisplayName(doorcard.user)
    : doorcard.name || "Faculty Member";

  // Group appointments by day
  const byDay: Record<string, any[]> = {};
  doorcard.appointments.forEach((apt) => {
    if (!byDay[apt.dayOfWeek]) {
      byDay[apt.dayOfWeek] = [];
    }
    byDay[apt.dayOfWeek].push(apt);
  });

  const daysToShow = WEEKDAYS_ONLY;

  // Format time for display
  const formatTime = (time: string) => {
    const [hour, min] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${min.toString().padStart(2, "0")} ${period}`;
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
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
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      border: 1px solid #d1d5db;
    }
    
    .legend-text {
      font-size: 9px;
      color: #4b5563;
    }
    
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: #6b7280;
    }
    
    .no-print { display: none !important; }
    
    @media screen {
      body { padding: 20px; }
      .no-print { display: block !important; }
    }
    
    @media print {
      .no-print { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; padding: 10px; background: #f0f9ff; border: 1px solid #3b82f6; border-radius: 4px; text-align: center;">
    <p style="margin: 0; color: #1e40af; font-weight: 600;">PDF Download Ready</p>
    <p style="margin: 4px 0 0 0; font-size: 10px; color: #6b7280;">Use Ctrl+P (Cmd+P on Mac) to save as PDF or print this page</p>
  </div>
  
  <div class="header">
    <div class="logo">Faculty Doorcard</div>
    <div class="term-info">${doorcard.term} ${doorcard.year} • ${doorcard.college}</div>
  </div>

  <div class="faculty-name">${displayName}</div>
  ${doorcard.user?.title ? `<div class="faculty-title">${doorcard.user.title}</div>` : ""}

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

  <div class="legend">
    <div class="legend-title">Activity Types</div>
    <div class="legend-items">
      ${Object.entries(CATEGORY_LABELS)
        .map(([category, label]) => {
          const bgColor =
            CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
            CATEGORY_COLORS.REFERENCE;
          return `
        <div class="legend-item">
          <div class="legend-color" style="background-color: ${bgColor};"></div>
          <span class="legend-text">${label}</span>
        </div>`;
        })
        .join("")}
    </div>
  </div>

  <div class="footer">
    <div>Generated from Faculty Doorcard System • ${new Date().toLocaleDateString()}</div>
    <div>San Mateo County Community College District</div>
  </div>
</body>
</html>
  `;
}

export function BulletproofPDFDownload({
  doorcard,
  doorcardId,
  className = "",
}: BulletproofPDFDownloadProps) {
  const [state, setState] = useState<PDFState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [downloadMethod, setDownloadMethod] = useState<DownloadMethod | null>(
    null
  );
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const browserInfo = useRef(getBrowserInfo());

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Method 1: React PDF with enhanced error handling
  const downloadWithReactPDF = useCallback(async (): Promise<boolean> => {
    try {
      // Dynamic import with timeout
      const importPromise = import("@react-pdf/renderer");
      const timeoutPromise = new Promise((_, reject) => {
        timeoutRef.current = setTimeout(
          () => reject(new Error("Import timeout")),
          10000
        );
      });

      const { pdf, Document, Page, Text, View, StyleSheet } =
        (await Promise.race([importPromise, timeoutPromise])) as any;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setState("generating");

      // Import the original DoorcardPDF document component
      const { DoorcardPDFDocument } = await import("./DoorcardPDF");

      // Use the original grid-based PDF document
      const MyDocument = () =>
        React.createElement(DoorcardPDFDocument, { doorcard });

      const blob = await pdf(React.createElement(MyDocument)).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${doorcard.name || "doorcard"}-schedule.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (err) {
      console.warn("React PDF download failed:", err);
      return false;
    }
  }, [doorcard]);

  // Method 2: Blob download with HTML content
  const downloadWithBlob = useCallback((): boolean => {
    try {
      if (!browserInfo.current.supportsDownload) {
        return false;
      }

      const htmlContent = generateEnhancedHTML(doorcard);
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${doorcard.name || "doorcard"}-schedule.html`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description:
          "HTML file downloaded. Open it and use 'Save as PDF' in your browser.",
      });

      return true;
    } catch (err) {
      console.warn("Blob download failed:", err);
      return false;
    }
  }, [doorcard, toast]);

  // Method 3: Print dialog fallback
  const openPrintDialog = useCallback((): boolean => {
    try {
      const htmlContent = generateEnhancedHTML(doorcard);
      const printWindow = window.open("", "_blank");

      if (!printWindow) {
        toast({
          variant: "destructive",
          title: "Popup Blocked",
          description: "Please allow popups and try again.",
        });
        return false;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 500);
      };

      return true;
    } catch (err) {
      console.warn("Print dialog failed:", err);
      return false;
    }
  }, [doorcard, toast]);

  // Method 4: Manual fallback
  const showManualFallback = useCallback(() => {
    const htmlContent = generateEnhancedHTML(doorcard);
    const newWindow = window.open("", "_blank");

    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();

      toast({
        title: "Manual Download",
        description:
          "Use Ctrl+P (Cmd+P on Mac) to save as PDF from the opened window.",
        duration: 8000,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Please enable popups or contact support.",
      });
    }
  }, [doorcard, toast]);

  // Main download handler with cascading fallbacks
  const handleDownload = useCallback(async () => {
    // Immediate feedback
    setState("loading");
    setError(null);

    // Track analytics
    if (doorcardId) {
      analytics.trackPrint(doorcardId, "download");
    }

    // Track attempt
    console.log(`PDF download attempt - Browser: ${browserInfo.current.name}`);

    try {
      // Method 1: Try React PDF first (skip on Firefox due to known issues)
      if (!browserInfo.current.isFirefox && !browserInfo.current.isIE) {
        setState("generating");
        setDownloadMethod(DownloadMethod.REACT_PDF);

        const reactPdfSuccess = await downloadWithReactPDF();
        if (reactPdfSuccess) {
          setState("idle");
          toast({
            title: "Download Complete",
            description: "PDF downloaded successfully!",
          });
          return;
        }
      }

      // Method 2: Try blob download
      setState("generating");
      setDownloadMethod(DownloadMethod.BLOB_DOWNLOAD);

      const blobSuccess = downloadWithBlob();
      if (blobSuccess) {
        setState("idle");
        return;
      }

      // Method 3: Try print dialog
      setState("generating");
      setDownloadMethod(DownloadMethod.PRINT_FALLBACK);

      const printSuccess = openPrintDialog();
      if (printSuccess) {
        setState("fallback");
        toast({
          title: "Print Dialog Opened",
          description: "Use 'Save as PDF' in the print dialog.",
        });

        // Reset state after a delay
        setTimeout(() => setState("idle"), 3000);
        return;
      }

      // Method 4: Manual fallback
      setState("fallback");
      setDownloadMethod(DownloadMethod.MANUAL_FALLBACK);
      showManualFallback();

      // Reset state after a delay
      setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      console.error("All PDF download methods failed:", err);
      setState("error");
      setError(err instanceof Error ? err.message : "Download failed");

      toast({
        variant: "destructive",
        title: "Download Failed",
        description:
          "Please try again or contact support if the issue persists.",
      });

      // Reset error state after delay
      setTimeout(() => {
        setState("idle");
        setError(null);
      }, 5000);
    }
  }, [
    downloadWithReactPDF,
    downloadWithBlob,
    openPrintDialog,
    showManualFallback,
    doorcardId,
    toast,
  ]);

  // Button content based on state
  const getButtonContent = () => {
    switch (state) {
      case "loading":
        return (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Preparing...
          </>
        );
      case "generating":
        return (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {downloadMethod === DownloadMethod.REACT_PDF
              ? "Generating PDF..."
              : downloadMethod === DownloadMethod.BLOB_DOWNLOAD
                ? "Creating Download..."
                : downloadMethod === DownloadMethod.PRINT_FALLBACK
                  ? "Opening Print..."
                  : "Processing..."}
          </>
        );
      case "downloading":
        return (
          <>
            <Download className="h-4 w-4 mr-2" />
            Downloading...
          </>
        );
      case "error":
        return (
          <>
            <AlertCircle className="h-4 w-4 mr-2" />
            Retry Download
          </>
        );
      case "fallback":
        return (
          <>
            <FileDown className="h-4 w-4 mr-2" />
            Opened in Browser
          </>
        );
      default:
        return (
          <>
            <FileDown className="h-4 w-4 mr-2" />
            Download PDF
          </>
        );
    }
  };

  const isDisabled =
    state === "loading" || state === "generating" || state === "downloading";
  const buttonVariant = state === "error" ? "destructive" : "default";

  return (
    <Button
      onClick={handleDownload}
      disabled={isDisabled}
      variant={buttonVariant}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${className}`}
      title={error || undefined}
    >
      {getButtonContent()}
    </Button>
  );
}

export default BulletproofPDFDownload;
