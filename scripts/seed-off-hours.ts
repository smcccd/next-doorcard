import {
  PrismaClient,
  College,
  DayOfWeek,
  AppointmentCategory,
  UserRole,
  TermSeason,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with off-hours test data...");

  // Create test user
  const hashedPassword = await bcrypt.hash("temp123!", 10);

  const testUser = await prisma.user.upsert({
    where: { email: "test@smccd.edu" },
    update: {},
    create: {
      id: "test-user-id",
      email: "test@smccd.edu",
      username: "testfaculty",
      name: "Dr. Test Faculty",
      firstName: "Test",
      lastName: "Faculty",
      title: "Professor",
      password: hashedPassword,
      role: UserRole.FACULTY,
      college: College.CSM,
      updatedAt: new Date(),
    },
  });

  // Create doorcard with off-hours appointments
  const doorcard = await prisma.doorcard.create({
    data: {
      id: "off-hours-test-doorcard",
      name: "Off-Hours Test Schedule",
      doorcardName: "Dr. Test Faculty - Fall 2025",
      officeNumber: "ITS-101",
      userId: testUser.id,
      term: TermSeason.FALL,
      year: 2025,
      college: College.CSM,
      isActive: true,
      isPublic: true, // Make it publicly accessible
      updatedAt: new Date(),
    },
  });

  // Create appointments with "off" times to test the calendar rendering fix
  const offHourAppointments = [
    {
      id: "math101-mon-1015",
      name: "MATH 101 - Algebra",
      startTime: "10:15", // Off-hour start time
      endTime: "11:00",
      dayOfWeek: DayOfWeek.MONDAY,
      category: AppointmentCategory.LECTURE,
    },
    {
      id: "office-hours-tue-1445",
      name: "Office Hours",
      startTime: "14:45", // Off-hour start time (2:45 PM)
      endTime: "16:00", // Until 4:00 PM
      dayOfWeek: DayOfWeek.TUESDAY,
      category: AppointmentCategory.OFFICE_HOURS,
    },
    {
      id: "math101-wed-1010",
      name: "MATH 101 - Algebra",
      startTime: "10:10", // Off-hour start time
      endTime: "11:00",
      dayOfWeek: DayOfWeek.WEDNESDAY,
      category: AppointmentCategory.LECTURE,
    },
    {
      id: "lab-thu-0920",
      name: "MATH 101 - Lab",
      startTime: "09:20", // Off-hour start time
      endTime: "10:30",
      dayOfWeek: DayOfWeek.THURSDAY,
      category: AppointmentCategory.LAB,
    },
    {
      id: "office-hours-fri-1315",
      name: "Office Hours",
      startTime: "13:15", // Off-hour start time (1:15 PM)
      endTime: "15:00", // Until 3:00 PM
      dayOfWeek: DayOfWeek.FRIDAY,
      category: AppointmentCategory.OFFICE_HOURS,
    },
    // Regular times for comparison
    {
      id: "regular-appointment-1",
      name: "CS 101 - Programming",
      startTime: "09:00", // Regular time
      endTime: "10:30",
      dayOfWeek: DayOfWeek.MONDAY,
      category: AppointmentCategory.LECTURE,
    },
    {
      id: "regular-appointment-2",
      name: "Office Hours",
      startTime: "14:00", // Regular time
      endTime: "15:30",
      dayOfWeek: DayOfWeek.WEDNESDAY,
      category: AppointmentCategory.OFFICE_HOURS,
    },
  ];

  for (const appointment of offHourAppointments) {
    await prisma.appointment.create({
      data: {
        ...appointment,
        doorcardId: doorcard.id,
        updatedAt: new Date(),
      },
    });
  }

  console.log(
    `✅ Created test doorcard with ${offHourAppointments.length} appointments (mix of off-hours and regular times)`
  );
  console.log(`📋 Test doorcard ID: ${doorcard.id}`);
  console.log(`🔗 Test URL: http://localhost:3000/view/${doorcard.id}`);
  console.log(`👤 Test user: test@smccd.edu / temp123!`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
