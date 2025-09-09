const {
  PrismaClient,
  College,
  DayOfWeek,
  AppointmentCategory,
  TermSeason,
} = require("@prisma/client");
const { randomUUID } = require("crypto");

// Use production database URL from .env
require("dotenv").config();
const prisma = new PrismaClient();

async function fixCurrentDoorcard() {
  try {
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

    console.log(
      `🗓️  Current term should be: ${currentTerm} ${currentTermYear}`
    );

    // Find the user
    const user = await prisma.user.findUnique({
      where: { username: "besnyib" },
      include: { Doorcard: true },
    });

    if (!user) {
      console.log("❌ User besnyib not found");
      return;
    }

    // Deactivate old doorcards
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

    console.log("🚀 Created current term doorcard");

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
      },
    ];

    for (const appointment of appointments) {
      await prisma.appointment.create({
        data: {
          ...appointment,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    console.log(
      "✅ Created",
      appointments.length,
      "appointments for current term"
    );
    console.log(
      `🎉 Current ${currentTerm} ${currentTermYear} doorcard created successfully!`
    );
    console.log(
      `📊 Access your CURRENT doorcard at: http://localhost:3000/view/besnyib/${termSlug}`
    );
    console.log(
      `📊 Or current term shortcut: http://localhost:3000/view/besnyib/current`
    );
  } catch (error) {
    console.error("❌ Error creating current doorcard:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCurrentDoorcard();
