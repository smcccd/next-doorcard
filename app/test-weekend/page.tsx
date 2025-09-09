import { DoorcardContainer } from "@/components/doorcard/DoorcardContainer";
import { SemanticSchedule } from "@/components/doorcard/SemanticSchedule";

// Test data with weekend appointments
const testDoorcardWithWeekend = {
  name: "Test Faculty",
  officeNumber: "TEST-101",
  term: "Fall",
  year: "2024",
  college: "CSM" as const,
  appointments: [
    {
      id: "1",
      name: "CS 101 - Programming",
      startTime: "09:00",
      endTime: "10:30",
      dayOfWeek: "MONDAY" as const,
      category: "LECTURE" as const,
      location: "Room 123",
    },
    {
      id: "2",
      name: "Saturday Office Hours",
      startTime: "10:00",
      endTime: "12:00",
      dayOfWeek: "SATURDAY" as const,
      category: "OFFICE_HOURS" as const,
      location: "Office",
    },
    {
      id: "3",
      name: "Early Meeting",
      startTime: "07:30",
      endTime: "08:30",
      dayOfWeek: "TUESDAY" as const,
      category: "OFFICE_HOURS" as const,
      location: "Office",
    },
  ],
  user: {
    name: "Test User",
    firstName: "Test",
    lastName: "User",
    title: "Professor",
    pronouns: null,
    displayFormat: null,
    website: null,
  },
};

// Test data without weekend appointments
const testDoorcardWeekdayOnly = {
  ...testDoorcardWithWeekend,
  appointments: testDoorcardWithWeekend.appointments.filter(
    (a) => !["SATURDAY", "SUNDAY"].includes(a.dayOfWeek)
  ),
};

export default function TestWeekendPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4">
        Testing Weekend Auto-Detection
      </h1>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">
            New Semantic View: With Weekend Appointments (should show 7 days)
          </h2>
          <DoorcardContainer
            doorcard={testDoorcardWithWeekend}
            defaultView="print"
          />
        </div>

        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-2">
            New Semantic View: Weekday Only (should show 5 days)
          </h2>
          <DoorcardContainer
            doorcard={testDoorcardWeekdayOnly}
            defaultView="print"
          />
        </div>

        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-2">
            Print-Optimized Semantic View: With Weekend Appointments
          </h2>
          <div className="border p-4 bg-white">
            <SemanticSchedule
              doorcard={testDoorcardWithWeekend}
              viewMode="print"
              containerId="print-test-weekend"
            />
          </div>
        </div>

        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-2">
            Print-Optimized Semantic View: Weekday Only
          </h2>
          <div className="border p-4 bg-white">
            <SemanticSchedule
              doorcard={testDoorcardWeekdayOnly}
              viewMode="print"
              containerId="print-test-weekday"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
