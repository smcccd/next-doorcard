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
import { DoorcardLite } from "../UnifiedDoorcard";
import { formatDisplayName } from "@/lib/display-name";

// Register fonts for better typography
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff2",
      fontWeight: 600,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyYAZ9hiA.woff2",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 11,
    padding: 40,
    backgroundColor: "#ffffff",
    color: "#1f2937",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#3b82f6",
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1f2937",
  },
  term: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 600,
  },
  facultyName: {
    fontSize: 28,
    fontWeight: 700,
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  facultyTitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
    textAlign: "center",
  },
  officeInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    padding: 15,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
  },
  officeItem: {
    flex: 1,
    alignItems: "center",
  },
  officeLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 4,
    fontWeight: 600,
    textTransform: "uppercase",
  },
  officeValue: {
    fontSize: 13,
    color: "#1f2937",
    fontWeight: 600,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1f2937",
    marginBottom: 15,
    textAlign: "center",
  },
  scheduleGrid: {
    flexDirection: "row",
    marginBottom: 20,
  },
  dayColumn: {
    flex: 1,
    marginRight: 4,
  },
  dayHeader: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    padding: 8,
    fontSize: 10,
    fontWeight: 600,
    textAlign: "center",
    marginBottom: 2,
  },
  timeSlot: {
    height: 24,
    marginBottom: 1,
    position: "relative",
  },
  timeLabel: {
    position: "absolute",
    left: -60,
    top: 0,
    fontSize: 8,
    color: "#6b7280",
    width: 50,
    textAlign: "right",
  },
  appointment: {
    backgroundColor: "#dbeafe",
    borderLeftWidth: 3,
    padding: 4,
    height: "100%",
    justifyContent: "center",
  },
  appointmentText: {
    fontSize: 8,
    color: "#1e40af",
    fontWeight: 600,
    textAlign: "center",
  },
  appointmentLocation: {
    fontSize: 7,
    color: "#6b7280",
    textAlign: "center",
  },
  legend: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    marginRight: 6,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 9,
    color: "#4b5563",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  footerText: {
    fontSize: 8,
    color: "#6b7280",
  },
  website: {
    fontSize: 8,
    color: "#3b82f6",
  },
});

// Category colors for legend
const CATEGORY_COLORS = {
  OFFICE_HOURS: "#3b82f6",
  CLASS: "#10b981",
  MEETING: "#8b5cf6",
  RESEARCH: "#f59e0b",
  OTHER: "#6b7280",
};

const CATEGORY_LABELS = {
  OFFICE_HOURS: "Office Hours",
  CLASS: "Class",
  MEETING: "Meeting",
  RESEARCH: "Research",
  OTHER: "Other",
};

// Time slots for the grid (7 AM to 9 PM)
const TIME_SLOTS = Array.from({ length: 29 }, (_, i) => {
  const hour = Math.floor(7 + i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  const display =
    hour > 12
      ? `${hour - 12}:${minute} PM`
      : hour === 12
        ? `12:${minute} PM`
        : `${hour}:${minute} AM`;
  return { time: `${hour.toString().padStart(2, "0")}:${minute}`, display };
});

const DAYS = [
  { key: "MONDAY", label: "Mon" },
  { key: "TUESDAY", label: "Tue" },
  { key: "WEDNESDAY", label: "Wed" },
  { key: "THURSDAY", label: "Thu" },
  { key: "FRIDAY", label: "Fri" },
];

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

function DoorcardPDFDocument({ doorcard }: DoorcardPDFProps) {
  const byDay = groupByDay(doorcard.appointments);
  const displayName = doorcard.user
    ? formatDisplayName(doorcard.user)
    : doorcard.name || "Faculty Member";
  const categories = [
    ...new Set(doorcard.appointments.map((apt) => apt.category)),
  ];

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Faculty Doorcard</Text>
          <Text style={styles.term}>
            {doorcard.term} {doorcard.year} • {doorcard.college}
          </Text>
        </View>

        {/* Faculty Info */}
        <Text style={styles.facultyName}>{displayName}</Text>
        {doorcard.user?.title && (
          <Text style={styles.facultyTitle}>{doorcard.user.title}</Text>
        )}

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
            <Text style={styles.officeValue}>{doorcard.college}</Text>
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

        {/* Schedule Grid */}
        <View style={styles.scheduleGrid}>
          {DAYS.map((day, dayIndex) => (
            <View key={day.key} style={styles.dayColumn}>
              <Text style={styles.dayHeader}>{day.label}</Text>
              {TIME_SLOTS.map((slot, slotIndex) => {
                const appointment = byDay[day.key]?.find((apt) =>
                  isSlotCovered(apt, slot.time),
                );

                return (
                  <View key={slot.time} style={styles.timeSlot}>
                    {dayIndex === 0 && slotIndex % 2 === 0 && (
                      <Text style={styles.timeLabel}>{slot.display}</Text>
                    )}
                    {appointment ? (
                      <View
                        style={[
                          styles.appointment,
                          {
                            borderLeftColor:
                              CATEGORY_COLORS[
                                appointment.category as keyof typeof CATEGORY_COLORS
                              ] || CATEGORY_COLORS.OTHER,
                            backgroundColor:
                              appointment.category === "OFFICE_HOURS"
                                ? "#dbeafe"
                                : appointment.category === "CLASS"
                                  ? "#d1fae5"
                                  : appointment.category === "MEETING"
                                    ? "#e7d3ff"
                                    : appointment.category === "RESEARCH"
                                      ? "#fef3c7"
                                      : "#f3f4f6",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.appointmentText,
                            {
                              color:
                                appointment.category === "OFFICE_HOURS"
                                  ? "#1e40af"
                                  : appointment.category === "CLASS"
                                    ? "#047857"
                                    : appointment.category === "MEETING"
                                      ? "#7c3aed"
                                      : appointment.category === "RESEARCH"
                                        ? "#d97706"
                                        : "#4b5563",
                            },
                          ]}
                        >
                          {appointment.name}
                        </Text>
                        {appointment.location && (
                          <Text style={styles.appointmentLocation}>
                            {appointment.location}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <View
                        style={{ height: "100%", backgroundColor: "#ffffff" }}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          ))}
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
                          ] || CATEGORY_COLORS.OTHER,
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

export function DoorcardPDF({
  doorcard,
  doorcardId,
  onDownload,
}: DoorcardPDFWrapperProps) {
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
