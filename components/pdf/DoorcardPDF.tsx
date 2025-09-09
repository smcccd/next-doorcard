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
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  TIME_SLOTS,
  WEEKDAYS_ONLY,
} from "@/lib/doorcard-constants";

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
    fontSize: 10,
    padding: 30,
    backgroundColor: "#ffffff",
    color: "#1f2937",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
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
    height: 18,
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
    borderLeftWidth: 3,
    padding: 3,
    height: "100%",
    justifyContent: "center",
  },
  appointmentText: {
    fontSize: 7,
    color: "#1f2937",
    fontWeight: 600,
    textAlign: "center",
  },
  appointmentLocation: {
    fontSize: 7,
    color: "#6b7280",
    textAlign: "center",
  },
  legend: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  legendTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: 6,
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  legendColor: {
    width: 10,
    height: 10,
    marginRight: 4,
    borderRadius: 1,
  },
  legendText: {
    fontSize: 8,
    color: "#4b5563",
  },
  footer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
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
    fontSize: 8,
    color: "#3b82f6",
  },
});

// Days for weekday-only view (more compact for single page)
const DAYS = WEEKDAYS_ONLY.map((day) => ({
  key: day.key,
  label: day.label.substring(0, 3), // Mon, Tue, Wed, Thu, Fri
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

function DoorcardPDFDocument({ doorcard }: DoorcardPDFProps) {
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
                  isSlotCovered(apt, slot.value)
                );

                return (
                  <View key={slot.value} style={styles.timeSlot}>
                    {dayIndex === 0 && slotIndex % 2 === 0 && (
                      <Text style={styles.timeLabel}>{slot.label}</Text>
                    )}
                    {appointment ? (
                      <View
                        style={[
                          styles.appointment,
                          {
                            backgroundColor:
                              CATEGORY_COLORS[
                                appointment.category as keyof typeof CATEGORY_COLORS
                              ] || CATEGORY_COLORS.REFERENCE,
                            borderLeftWidth: 3,
                            borderLeftColor: "#1f2937",
                          },
                        ]}
                      >
                        <Text style={styles.appointmentText}>
                          {appointment.name.replace(/^(.*?)\s*-\s*/, "")}
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
