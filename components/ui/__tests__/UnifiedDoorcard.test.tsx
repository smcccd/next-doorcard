import { render, screen } from "@testing-library/react";
import { UnifiedDoorcard } from "@/components/UnifiedDoorcard";
import type {
  DoorcardLite,
  AppointmentLite,
} from "@/components/UnifiedDoorcard";

describe("UnifiedDoorcard", () => {
  const mockDoorcard: DoorcardLite = {
    name: "Dr. Test Professor",
    doorcardName: "Test Doorcard Fall 2024",
    officeNumber: "Building A, Room 101",
    term: "Fall",
    year: "2024",
    college: "SKYLINE",
    appointments: [],
    user: {
      name: "Dr. Test Professor",
      firstName: "Test",
      lastName: "Professor",
      title: "Dr.",
      pronouns: "they/them",
      displayFormat: "TITLE_FIRST_LAST",
      website: "https://example.com",
    },
  };

  const mockAppointments: AppointmentLite[] = [
    {
      id: "appt1",
      name: "Office Hours",
      startTime: "09:00",
      endTime: "10:30",
      dayOfWeek: "MONDAY",
      category: "OFFICE_HOURS",
      location: "Room 101",
    },
    {
      id: "appt2",
      name: "CS 101 - Introduction to Programming",
      startTime: "10:30",
      endTime: "12:00",
      dayOfWeek: "MONDAY",
      category: "IN_CLASS",
      location: "Lab 201",
    },
    {
      id: "appt3",
      name: "Department Meeting",
      startTime: "14:00",
      endTime: "15:00",
      dayOfWeek: "WEDNESDAY",
      category: "REFERENCE",
      location: "Conference Room",
    },
  ];

  describe("Header Information", () => {
    it("should display doorcard name", () => {
      render(<UnifiedDoorcard doorcard={mockDoorcard} />);
      // The doorcard name appears in the h1 element
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Test Professor (they/them)");
    });

    it("should display faculty name with proper formatting", () => {
      render(<UnifiedDoorcard doorcard={mockDoorcard} />);
      // The formatted name is displayed in the header
      expect(
        screen.getByText("Test Professor (they/them)")
      ).toBeInTheDocument();
    });

    it("should display office location", () => {
      render(<UnifiedDoorcard doorcard={mockDoorcard} />);
      expect(screen.getByText("Building A, Room 101")).toBeInTheDocument();
    });

    it("should display term and year", () => {
      render(<UnifiedDoorcard doorcard={mockDoorcard} />);
      expect(screen.getByText(/Fall 2024/)).toBeInTheDocument();
    });

    it("should display pronouns when available", () => {
      render(<UnifiedDoorcard doorcard={mockDoorcard} />);
      // Pronouns are displayed as part of the formatted name in parentheses
      expect(screen.getByText(/\(they\/them\)/)).toBeInTheDocument();
    });

    it("should handle missing doorcard name gracefully", () => {
      const doorcardWithoutName = { ...mockDoorcard, doorcardName: undefined };
      render(<UnifiedDoorcard doorcard={doorcardWithoutName} />);
      // Should still display the formatted name
      expect(
        screen.getByText("Test Professor (they/them)")
      ).toBeInTheDocument();
    });
  });

  describe("Schedule Grid", () => {
    it("should display weekday headers", () => {
      render(<UnifiedDoorcard doorcard={mockDoorcard} />);

      expect(screen.getByText("Monday")).toBeInTheDocument();
      expect(screen.getByText("Tuesday")).toBeInTheDocument();
      expect(screen.getByText("Wednesday")).toBeInTheDocument();
      expect(screen.getByText("Thursday")).toBeInTheDocument();
      expect(screen.getByText("Friday")).toBeInTheDocument();
    });

    it("should display weekend headers when showWeekendDays is true", () => {
      render(
        <UnifiedDoorcard doorcard={mockDoorcard} showWeekendDays={true} />
      );

      expect(screen.getByText("Saturday")).toBeInTheDocument();
      expect(screen.getByText("Sunday")).toBeInTheDocument();
    });

    it("should hide weekend headers when showWeekendDays is false", () => {
      render(
        <UnifiedDoorcard doorcard={mockDoorcard} showWeekendDays={false} />
      );

      expect(screen.queryByText("Saturday")).not.toBeInTheDocument();
      expect(screen.queryByText("Sunday")).not.toBeInTheDocument();
    });

    it("should display time slots", () => {
      render(<UnifiedDoorcard doorcard={mockDoorcard} />);

      expect(screen.getByText("8:00 AM")).toBeInTheDocument();
      expect(screen.getByText("9:00 AM")).toBeInTheDocument();
      expect(screen.getByText("12:00 PM")).toBeInTheDocument();
      expect(screen.getByText("5:00 PM")).toBeInTheDocument();
    });
  });

  describe("Appointments", () => {
    it("should display appointments in correct time slots", () => {
      const doorcardWithAppointments = {
        ...mockDoorcard,
        appointments: mockAppointments,
      };
      render(<UnifiedDoorcard doorcard={doorcardWithAppointments} />);

      expect(screen.getAllByText("Office Hours")).toHaveLength(2); // One in schedule, one in legend
      expect(screen.getByText("CS 101")).toBeInTheDocument();
      expect(screen.getByText("Department M")).toBeInTheDocument(); // extractCourseCode truncates to 12 chars
    });

    it("should display appointment locations", () => {
      const doorcardWithAppointments = {
        ...mockDoorcard,
        appointments: mockAppointments,
      };
      render(<UnifiedDoorcard doorcard={doorcardWithAppointments} />);

      expect(screen.getByText("Room 101")).toBeInTheDocument();
      expect(screen.getByText("Lab 201")).toBeInTheDocument();
      expect(screen.getByText("Conference Room")).toBeInTheDocument();
    });

    it("should display appointment time ranges", () => {
      const doorcardWithAppointments = {
        ...mockDoorcard,
        appointments: mockAppointments,
      };
      render(<UnifiedDoorcard doorcard={doorcardWithAppointments} />);

      expect(screen.getByText("9:00 AM - 10:30 AM")).toBeInTheDocument();
      expect(screen.getByText("10:30 AM - 12:00 PM")).toBeInTheDocument();
      expect(screen.getByText("2:00 PM - 3:00 PM")).toBeInTheDocument();
    });

    it("should apply correct category colors", () => {
      const doorcardWithAppointments = {
        ...mockDoorcard,
        appointments: mockAppointments,
      };
      render(<UnifiedDoorcard doorcard={doorcardWithAppointments} />);

      // Office hours should have the specified background color from CATEGORY_COLORS
      const officeHoursElements = screen.getAllByText("Office Hours");
      const officeHoursInSchedule = officeHoursElements[0].closest("td"); // First one is in schedule
      expect(officeHoursInSchedule).toHaveStyle("background-color: #E1E2CA");

      // Classes should have the IN_CLASS color
      const classElement = screen.getByText("CS 101").closest("td");
      expect(classElement).toHaveStyle("background-color: #99B5D5");
    });

    it("should extract and display course codes", () => {
      const doorcardWithAppointments = {
        ...mockDoorcard,
        appointments: mockAppointments,
      };
      render(<UnifiedDoorcard doorcard={doorcardWithAppointments} />);

      // Should extract "CS 101" from the full class name
      expect(screen.getByText("CS 101")).toBeInTheDocument();
    });

    it("should handle appointments spanning multiple time slots", () => {
      const longAppointment: AppointmentLite = {
        id: "long1",
        name: "Extended Office Hours",
        startTime: "09:00",
        endTime: "12:00",
        dayOfWeek: "TUESDAY",
        category: "OFFICE_HOURS",
        location: "Room 101",
      };

      const doorcardWithLongAppointment = {
        ...mockDoorcard,
        appointments: [longAppointment],
      };
      render(<UnifiedDoorcard doorcard={doorcardWithLongAppointment} />);

      expect(screen.getAllByText("Office Hours")).toHaveLength(2); // One in schedule, one in legend
      expect(screen.getByText("9:00 AM - 12:00 PM")).toBeInTheDocument();
    });
  });

  describe("Empty States", () => {
    it("should show empty schedule when no appointments", () => {
      render(<UnifiedDoorcard doorcard={mockDoorcard} />);

      // Should still show the grid structure
      expect(screen.getByText("Monday")).toBeInTheDocument();
      expect(screen.getByText("7:00 AM")).toBeInTheDocument(); // Time slots start at 7:00 AM

      // Office Hours should only appear in the legend, not in the schedule
      expect(screen.getAllByText("Office Hours")).toHaveLength(1); // Only in legend
    });
  });

  describe("Website Link", () => {
    it("should display website link when available", () => {
      render(<UnifiedDoorcard doorcard={mockDoorcard} />);

      const websiteLink = screen.getByRole("link", {
        name: /faculty website/i,
      });
      expect(websiteLink).toHaveAttribute("href", "https://example.com");
      expect(websiteLink).toHaveAttribute("target", "_blank");
      expect(websiteLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("should not display website section when no website", () => {
      const doorcardWithoutWebsite = {
        ...mockDoorcard,
        user: { ...mockDoorcard.user, website: null },
      };
      render(<UnifiedDoorcard doorcard={doorcardWithoutWebsite} />);

      expect(
        screen.queryByRole("link", { name: /faculty website/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      render(<UnifiedDoorcard doorcard={mockDoorcard} />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Test Professor (they/them)");
    });

    it("should have accessible time slot labels", () => {
      const doorcardWithAppointments = {
        ...mockDoorcard,
        appointments: mockAppointments,
      };
      render(<UnifiedDoorcard doorcard={doorcardWithAppointments} />);

      // Time slots should be readable
      expect(screen.getByText("9:00 AM - 10:30 AM")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing user data", () => {
      const doorcardWithoutUser = { ...mockDoorcard, user: undefined };
      render(<UnifiedDoorcard doorcard={doorcardWithoutUser} />);

      expect(screen.getByText("Dr. Test Professor")).toBeInTheDocument(); // Falls back to doorcard.name
    });

    it("should handle missing name fields", () => {
      const doorcardWithPartialUser = {
        ...mockDoorcard,
        name: undefined,
        user: {
          ...mockDoorcard.user,
          name: null,
          firstName: null,
          lastName: null,
        },
      };
      render(<UnifiedDoorcard doorcard={doorcardWithPartialUser} />);

      expect(screen.getByText("Faculty Member")).toBeInTheDocument(); // formatDisplayName fallback
    });

    it("should handle appointments at day boundaries", () => {
      const earlyAppointment: AppointmentLite = {
        id: "early1",
        name: "Early Morning Class",
        startTime: "07:00",
        endTime: "08:30",
        dayOfWeek: "MONDAY",
        category: "IN_CLASS",
        location: "Room 101",
      };

      const lateAppointment: AppointmentLite = {
        id: "late1",
        name: "Evening Class",
        startTime: "18:00",
        endTime: "20:30",
        dayOfWeek: "MONDAY",
        category: "IN_CLASS",
        location: "Room 102",
      };

      const doorcardWithBoundaryAppointments = {
        ...mockDoorcard,
        appointments: [earlyAppointment, lateAppointment],
      };
      render(<UnifiedDoorcard doorcard={doorcardWithBoundaryAppointments} />);

      expect(screen.getByText("Early Mornin")).toBeInTheDocument(); // extractCourseCode truncates to 12 chars
      expect(screen.getByText("Evening Clas")).toBeInTheDocument(); // extractCourseCode truncates to 12 chars
    });
  });
});
