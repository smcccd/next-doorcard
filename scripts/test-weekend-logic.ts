// Test the weekend detection logic without database
import { ALL_DAYS } from "../lib/doorcard-constants";

interface AppointmentLite {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  category: string;
  location?: string | null;
}

const DAY_LABELS = ALL_DAYS;

function groupByDay(appts: AppointmentLite[]) {
  const map: Partial<Record<string, AppointmentLite[]>> = {};
  for (const a of appts) {
    (map[a.dayOfWeek] ||= []).push(a);
  }
  return map;
}

function testWeekendLogic() {
  console.log("🧪 Testing weekend detection logic...\n");

  // Test Case 1: Only weekday appointments
  const weekdayOnly: AppointmentLite[] = [
    {
      id: "1",
      name: "CS 101",
      startTime: "09:00",
      endTime: "10:30",
      dayOfWeek: "MONDAY",
      category: "LECTURE",
    },
    {
      id: "2",
      name: "MATH 101",
      startTime: "10:15",
      endTime: "11:00",
      dayOfWeek: "WEDNESDAY",
      category: "LECTURE",
    },
    {
      id: "3",
      name: "Office Hours",
      startTime: "14:00",
      endTime: "15:30",
      dayOfWeek: "FRIDAY",
      category: "OFFICE_HOURS",
    },
  ];

  // Test Case 2: Mix with weekend appointments
  const withWeekends: AppointmentLite[] = [
    ...weekdayOnly,
    {
      id: "4",
      name: "Study Group",
      startTime: "10:00",
      endTime: "12:00",
      dayOfWeek: "SATURDAY",
      category: "REFERENCE",
    },
  ];

  console.log("📋 Test Case 1: Weekdays only");
  const byDay1 = groupByDay(weekdayOnly);
  const hasWeekends1 = Boolean(
    byDay1.SATURDAY?.length || byDay1.SUNDAY?.length
  );
  const shouldShow1 = false || hasWeekends1; // showWeekendDays = false

  const days1 = DAY_LABELS.filter((d) =>
    shouldShow1 ? true : d.key !== "SATURDAY" && d.key !== "SUNDAY"
  );

  console.log(`  Appointments: ${weekdayOnly.length}`);
  console.log(`  Has weekends: ${hasWeekends1}`);
  console.log(`  Should show weekends: ${shouldShow1}`);
  console.log(`  Days to display: ${days1.map((d) => d.label).join(", ")}`);
  console.log(
    `  Expected result: Monday, Tuesday, Wednesday, Thursday, Friday\n`
  );

  console.log("📋 Test Case 2: With weekend appointments");
  const byDay2 = groupByDay(withWeekends);
  const hasWeekends2 = Boolean(
    byDay2.SATURDAY?.length || byDay2.SUNDAY?.length
  );
  const shouldShow2 = false || hasWeekends2; // showWeekendDays = false

  const days2 = DAY_LABELS.filter((d) =>
    shouldShow2 ? true : d.key !== "SATURDAY" && d.key !== "SUNDAY"
  );

  console.log(`  Appointments: ${withWeekends.length}`);
  console.log(`  Has weekends: ${hasWeekends2}`);
  console.log(`  Should show weekends: ${shouldShow2}`);
  console.log(`  Days to display: ${days2.map((d) => d.label).join(", ")}`);
  console.log(
    `  Expected result: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday\n`
  );

  console.log(
    "✅ Logic test complete. The weekend detection should work correctly."
  );
}

testWeekendLogic();
