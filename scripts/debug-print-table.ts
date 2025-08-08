// Debug script to understand the print table issue

const appointments = [
  {
    id: "1",
    name: "CS 101",
    startTime: "09:00",
    endTime: "10:30",
    dayOfWeek: "MONDAY",
  },
  {
    id: "2",
    name: "Office Hours",
    startTime: "10:00",
    endTime: "12:00",
    dayOfWeek: "SATURDAY",
  },
];

const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
];

function isSlotCovered(apt: any, slot: string) {
  const [slotHour, slotMin] = slot.split(":").map(Number);
  const [startHour, startMin] = apt.startTime.split(":").map(Number);
  const [endHour, endMin] = apt.endTime.split(":").map(Number);

  const slotMinutes = slotHour * 60 + slotMin;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return slotMinutes >= startMinutes && slotMinutes < endMinutes;
}

console.log("Checking slot coverage for Monday appointment (9:00-10:30):");
TIME_SLOTS.forEach((slot) => {
  const covered = isSlotCovered(appointments[0], slot);
  console.log(`${slot}: ${covered ? "COVERED" : "empty"}`);
});

console.log("\nTable cells that would be rendered:");
console.log("Time | Monday | Saturday");
console.log("-----|--------|----------");

TIME_SLOTS.forEach((slot, index) => {
  let mondayCell = "";
  let saturdayCell = "";

  const mondayAppt = appointments.find(
    (a) => a.dayOfWeek === "MONDAY" && a.startTime === slot
  );
  const saturdayAppt = appointments.find(
    (a) => a.dayOfWeek === "SATURDAY" && a.startTime === slot
  );

  if (mondayAppt) {
    mondayCell = "CS 101 (rowspan)";
  } else if (
    isSlotCovered(appointments[0], slot) &&
    appointments[0].startTime !== slot
  ) {
    mondayCell = "NULL (covered)";
  } else {
    mondayCell = "empty cell";
  }

  if (saturdayAppt) {
    saturdayCell = "Office (rowspan)";
  } else if (
    appointments[1] &&
    isSlotCovered(appointments[1], slot) &&
    appointments[1].startTime !== slot
  ) {
    saturdayCell = "NULL (covered)";
  } else {
    saturdayCell = "empty cell";
  }

  console.log(`${slot} | ${mondayCell} | ${saturdayCell}`);
});

console.log(
  "\nThe issue: When we return NULL for covered slots, we're not rendering a <td> element,"
);
console.log(
  "which breaks the table structure. We should skip rendering those rows entirely when using rowspan."
);
