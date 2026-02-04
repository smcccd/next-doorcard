const {
  PrismaClient,
  College,
  DayOfWeek,
  AppointmentCategory,
  TermSeason,
} = require("@prisma/client");
const { randomUUID } = require("crypto");

// Load environment in Next.js-like order
require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local", override: true });

const prisma = new PrismaClient();

async function createLocalDoorcard() {
  try {
    console.log("🔍 Creating doorcard in LOCAL SQLite database...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { username: "besnyib" },
    });

    if (!user) {
      console.log("❌ User besnyib not found in local database");
      return;
    }

    console.log("✅ Found user:", user.name);

    // Get current date to determine the correct term
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-based
    const currentYear = now.getFullYear();

    let currentTerm, currentTermYear;

    // Determine current academic term
    if (currentMonth >= 8 && currentMonth <= 12) {
      // August-December = Fall term
      currentTerm = TermSeason.FALL;
      currentTermYear = currentYear;
    } else if (currentMonth >= 1 && currentMonth <= 5) {
      // January-May = Spring term
      currentTerm = TermSeason.SPRING;
      currentTermYear = currentYear;
    } else {
      // June-July = Summer term
      currentTerm = TermSeason.SUMMER;
      currentTermYear = currentYear;
    }

    console.log(`📅 Creating ${currentTerm} ${currentTermYear} doorcard...`);

    // Deactivate any existing active doorcards
    await prisma.doorcard.updateMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    console.log("📝 Deactivated old doorcards");

    // Create current term doorcard
    const termSlug = `${currentTerm.toLowerCase()}-${currentTermYear}`;
    const doorcard = await prisma.doorcard.create({
      data: {
        id: randomUUID(),
        name: `Bryan Besnyi - ${currentTerm} ${currentTermYear}`,
        doorcardName: "Bryan Besnyi",
        officeNumber: "CSM-123",
        term: currentTerm,
        year: currentTermYear,
        college: College.CSM,
        isActive: true,
        isPublic: true,
        slug: `bryan-besnyi-${termSlug}`,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("✅ Created doorcard:", doorcard.id);

    // Create realistic current schedule
    const appointments = [
      {
        id: randomUUID(),
        name: "CS 134 - Data Structures & Algorithms",
        startTime: "09:00",
        endTime: "10:30",
        dayOfWeek: DayOfWeek.MONDAY,
        category: AppointmentCategory.LECTURE,
        location: "CSM Room 15-220",
        doorcardId: doorcard.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "CS 134 - Data Structures & Algorithms",
        startTime: "09:00",
        endTime: "10:30",
        dayOfWeek: DayOfWeek.WEDNESDAY,
        category: AppointmentCategory.LECTURE,
        location: "CSM Room 15-220",
        doorcardId: doorcard.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "CS 134 - Data Structures & Algorithms",
        startTime: "09:00",
        endTime: "10:30",
        dayOfWeek: DayOfWeek.FRIDAY,
        category: AppointmentCategory.LECTURE,
        location: "CSM Room 15-220",
        doorcardId: doorcard.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "CS 270 - Computer Architecture",
        startTime: "14:00",
        endTime: "15:30",
        dayOfWeek: DayOfWeek.TUESDAY,
        category: AppointmentCategory.LECTURE,
        location: "CSM Room 15-200",
        doorcardId: doorcard.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "CS 270 - Computer Architecture",
        startTime: "14:00",
        endTime: "15:30",
        dayOfWeek: DayOfWeek.THURSDAY,
        category: AppointmentCategory.LECTURE,
        location: "CSM Room 15-200",
        doorcardId: doorcard.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "CS 134 Lab Session",
        startTime: "11:00",
        endTime: "13:00",
        dayOfWeek: DayOfWeek.TUESDAY,
        category: AppointmentCategory.LAB,
        location: "CSM Computer Lab 15-110",
        doorcardId: doorcard.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "CS 270 Lab Session",
        startTime: "11:00",
        endTime: "13:00",
        dayOfWeek: DayOfWeek.FRIDAY,
        category: AppointmentCategory.LAB,
        location: "CSM Computer Lab 15-110",
        doorcardId: doorcard.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Office Hours",
        startTime: "15:30",
        endTime: "17:00",
        dayOfWeek: DayOfWeek.MONDAY,
        category: AppointmentCategory.OFFICE_HOURS,
        location: "CSM-123",
        doorcardId: doorcard.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Office Hours",
        startTime: "15:30",
        endTime: "17:00",
        dayOfWeek: DayOfWeek.WEDNESDAY,
        category: AppointmentCategory.OFFICE_HOURS,
        location: "CSM-123",
        doorcardId: doorcard.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Faculty Meeting",
        startTime: "16:00",
        endTime: "17:30",
        dayOfWeek: DayOfWeek.THURSDAY,
        category: AppointmentCategory.REFERENCE,
        location: "CSM Faculty Conference Room",
        doorcardId: doorcard.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const appointment of appointments) {
      await prisma.appointment.create({
        data: appointment,
      });
    }

    console.log("✅ Created", appointments.length, "appointments");
    console.log(
      `🎉 LOCAL ${currentTerm} ${currentTermYear} doorcard created successfully!`
    );
    console.log(`📊 Test URLs:`);
    console.log(`   Current: http://localhost:3000/view/besnyib/current`);
    console.log(`   Specific: http://localhost:3000/view/besnyib/${termSlug}`);
  } catch (error) {
    console.error("❌ Error creating local doorcard:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createLocalDoorcard();
