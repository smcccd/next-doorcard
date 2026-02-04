"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  Font,
} from "@react-pdf/renderer";
import { DoorcardLite } from "../doorcard/UnifiedDoorcard";
import { formatDisplayName, getCollegeDisplayName } from "@/lib/display-name";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  TIME_SLOTS,
  WEEKDAYS_ONLY,
} from "@/lib/doorcard/doorcard-constants";

// Use built-in fonts to avoid CORS issues with external font loading
// Helvetica is a built-in PDF font that provides excellent readability
// This eliminates the "Failed to fetch" errors from Google Fonts CDN

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 30,
    backgroundColor: "#ffffff",
    color: "#1f2937",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#3b82f6",
  },
  logo: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1f2937",
  },
  term: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: 600,
  },
  facultyInfo: {
    alignItems: "center",
    marginBottom: 12,
  },
  facultyName: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 2,
  },
  facultyTitle: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "center",
  },
  officeInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  officeItem: {
    alignItems: "center",
  },
  officeLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 3,
    fontWeight: 600,
    textTransform: "uppercase",
  },
  officeValue: {
    fontSize: 10,
    color: "#1f2937",
    fontWeight: 600,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  scheduleContainer: {
    flex: 1,
    maxHeight: 480,
    position: "relative",
  },
  scheduleGrid: {
    flexDirection: "row",
    height: "100%",
    marginLeft: 45,
  },
  timeColumn: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 45,
    height: "100%",
  },
  timeSlotLabel: {
    height: 15,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 5,
    marginBottom: 0,
    borderBottomWidth: 0.25,
    borderBottomColor: "#e5e7eb",
    borderRightWidth: 0.5,
    borderRightColor: "#d1d5db",
  },
  timeText: {
    fontSize: 7,
    color: "#6b7280",
  },
  dayColumn: {
    flex: 1,
    marginRight: 0,
    borderRightWidth: 0.25,
    borderRightColor: "#d1d5db",
  },
  dayHeader: {
    backgroundColor: "#60a5fa",
    color: "#ffffff",
    padding: 2,
    fontSize: 8,
    fontWeight: 600,
    textAlign: "center",
    marginBottom: 1,
    height: 14,
    borderBottomWidth: 0.25,
    borderBottomColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
  },
  timeSlot: {
    height: 15,
    marginBottom: 0,
    margin: 0,
    padding: 0,
    position: "relative",
    borderBottomWidth: 0.25,
    borderBottomColor: "#e5e7eb",
    borderRightWidth: 0.25,
    borderRightColor: "#e5e7eb",
  },
  appointment: {
    borderLeftWidth: 0,
    padding: 2,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 15,
  },
  appointmentText: {
    fontSize: 7,
    color: "#1f2937",
    fontWeight: 500,
    textAlign: "center",
    lineHeight: 1.2,
  },
  appointmentLocation: {
    fontSize: 7,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 1,
  },
  legend: {
    marginTop: 12,
    padding: 6,
    backgroundColor: "#f8fafc",
    borderRadius: 3,
  },
  legendTitle: {
    fontSize: 9,
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: 4,
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    marginRight: 8,
  },
  legendColor: {
    width: 8,
    height: 8,
    marginRight: 3,
    borderRadius: 1,
  },
  legendText: {
    fontSize: 7,
    color: "#4b5563",
  },
  footer: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: "#6b7280",
  },
  website: {
    fontSize: 7,
    color: "#3b82f6",
  },
});

// Days for weekday-only view (full names for PDF)
const DAYS = WEEKDAYS_ONLY.map((day) => ({
  key: day.key,
  label: day.label, // Monday, Tuesday, Wednesday, Thursday, Friday
}));

interface DoorcardPDFProps {
  doorcard: DoorcardLite;
}

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

// Helper function to check if appointment covers time slot
function isSlotCovered(appointment: AppointmentForPDF, slot: string) {
  const [slotHour, slotMin] = slot.split(":").map(Number);
  const [startHour, startMin] = appointment.startTime.split(":").map(Number);
  const [endHour, endMin] = appointment.endTime.split(":").map(Number);

  const slotMinutes = slotHour * 60 + slotMin;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return slotMinutes >= startMinutes && slotMinutes < endMinutes;
}

// Group appointments by day
function groupByDay(appointments: AppointmentForPDF[]) {
  const grouped: Record<string, AppointmentForPDF[]> = {};
  appointments.forEach((apt) => {
    if (!grouped[apt.dayOfWeek]) {
      grouped[apt.dayOfWeek] = [];
    }
    grouped[apt.dayOfWeek].push(apt);
  });
  return grouped;
}

export function DoorcardPDFDocument({ doorcard }: DoorcardPDFProps) {
  const byDay = groupByDay(doorcard.appointments);
  const displayName = doorcard.user
    ? formatDisplayName(doorcard.user)
    : doorcard.name || "Faculty Member";
  // Show all categories in legend
  const categories = [
    "OFFICE_HOURS",
    "IN_CLASS",
    "LECTURE",
    "LAB",
    "HOURS_BY_ARRANGEMENT",
    "REFERENCE",
  ];

  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Faculty Doorcard</Text>
          <Text style={styles.term}>
            {doorcard.term} {doorcard.year} •{" "}
            {getCollegeDisplayName(doorcard.college || "")}
          </Text>
        </View>

        {/* Faculty Info - Keep together to prevent orphaning */}
        <View style={styles.facultyInfo} wrap={false}>
          <Text style={styles.facultyName}>{displayName}</Text>
        </View>

        {/* Office Information */}
        <View style={styles.officeInfo}>
          <View style={styles.officeItem}>
            <Text style={styles.officeLabel}>Office</Text>
            <Text style={styles.officeValue}>
              {doorcard.officeNumber || "TBA"}
            </Text>
          </View>
          <View style={styles.officeItem}>
            <Text style={styles.officeLabel}>Campus</Text>
            <Text style={styles.officeValue}>
              {getCollegeDisplayName(doorcard.college || "")}
            </Text>
          </View>
          {doorcard.user?.website && (
            <View style={styles.officeItem}>
              <Text style={styles.officeLabel}>Website</Text>
              <Text style={[styles.officeValue, styles.website]}>
                {doorcard.user.website.replace(/^https?:\/\//, "")}
              </Text>
            </View>
          )}
        </View>

        {/* Schedule Title */}
        <Text style={styles.scheduleTitle}>Weekly Schedule</Text>

        {/* Schedule Container with proper layout */}
        <View style={styles.scheduleContainer} wrap={false}>
          {/* Time Column - Absolute positioned */}
          <View style={styles.timeColumn}>
            {/* Empty header slot to align with day headers */}
            <View style={{ height: 14, marginBottom: 1 }} />
            {TIME_SLOTS.map((slot, slotIndex) => (
              <View key={slot.value} style={styles.timeSlotLabel}>
                <Text style={styles.timeText}>{slot.label}</Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.scheduleGrid}>
            {DAYS.map((day, dayIndex) => (
              <View key={day.key} style={styles.dayColumn}>
                <Text style={styles.dayHeader}>{day.label}</Text>
                {TIME_SLOTS.map((slot, slotIndex) => {
                  const appointment = byDay[day.key]?.find((apt) =>
                    isSlotCovered(apt, slot.value)
                  );

                  // Skip rendering slots that are covered by previous appointments
                  const previousSlotHasAppointment =
                    slotIndex > 0 &&
                    byDay[day.key]?.find((apt) => {
                      const prevSlot = TIME_SLOTS[slotIndex - 1];
                      return (
                        isSlotCovered(apt, prevSlot.value) &&
                        apt.startTime !== prevSlot.value
                      );
                    });

                  if (
                    previousSlotHasAppointment &&
                    appointment &&
                    appointment.startTime !== slot.value
                  ) {
                    return null; // Skip this slot as it's covered by previous appointment
                  }

                  const isStartingSlot =
                    appointment && appointment.startTime === slot.value;

                  // Calculate appointment height for spanning
                  let appointmentHeight = 15;
                  let slotHeight = 15;

                  if (isStartingSlot) {
                    const [startHour, startMin] = appointment.startTime
                      .split(":")
                      .map(Number);
                    const [endHour, endMin] = appointment.endTime
                      .split(":")
                      .map(Number);
                    const durationMinutes =
                      endHour * 60 + endMin - (startHour * 60 + startMin);
                    const slotCount = Math.ceil(durationMinutes / 30);
                    appointmentHeight = 15 * slotCount; // No margin gaps now
                    slotHeight = appointmentHeight;
                  }

                  return (
                    <View
                      key={slot.value}
                      style={[styles.timeSlot, { height: slotHeight }]}
                    >
                      {isStartingSlot ? (
                        <View
                          style={[
                            styles.appointment,
                            {
                              backgroundColor:
                                CATEGORY_COLORS[
                                  appointment.category as keyof typeof CATEGORY_COLORS
                                ] || CATEGORY_COLORS.REFERENCE,
                              height: appointmentHeight,
                            },
                          ]}
                        >
                          <Text style={styles.appointmentText}>
                            {appointment.name.replace(/^(.*?)\s*-\s*/, "")}{" "}
                            {appointment.startTime}-{appointment.endTime}
                            {appointment.location &&
                              ` • ${appointment.location}`}
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={{ height: "100%", backgroundColor: "#ffffff" }}
                        />
                      )}
                    </View>
                  );
                }).filter(Boolean)}
              </View>
            ))}
          </View>
        </View>

        {/* Legend */}
        {categories.length > 0 && (
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Activity Types</Text>
            <View style={styles.legendItems}>
              {categories.map((category) => (
                <View key={category} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendColor,
                      {
                        backgroundColor:
                          CATEGORY_COLORS[
                            category as keyof typeof CATEGORY_COLORS
                          ] || CATEGORY_COLORS.REFERENCE,
                      },
                    ]}
                  />
                  <Text style={styles.legendText}>
                    {CATEGORY_LABELS[
                      category as keyof typeof CATEGORY_LABELS
                    ] || category}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated from Faculty Doorcard System •{" "}
            {new Date().toLocaleDateString()}
          </Text>
          <Text style={styles.footerText}>
            San Mateo County Community College District
          </Text>
        </View>
      </Page>
    </Document>
  );
}

interface DoorcardPDFWrapperProps extends DoorcardPDFProps {
  doorcardId?: string;
  onDownload?: () => void;
}

export function DoorcardPDF({ doorcard, onDownload }: DoorcardPDFWrapperProps) {
  const fileName = `${doorcard.name || "doorcard"}-schedule.pdf`;

  const handleDownload = () => {
    onDownload?.(); // Call the analytics tracking
  };

  return (
    <PDFDownloadLink
      document={<DoorcardPDFDocument doorcard={doorcard} />}
      fileName={fileName}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      onClick={handleDownload}
    >
      {({ loading }) =>
        loading ? (
          "Generating PDF..."
        ) : (
          <>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </>
        )
      }
    </PDFDownloadLink>
  );
}
