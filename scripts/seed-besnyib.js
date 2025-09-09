const {
  PrismaClient,
  College,
  DayOfWeek,
  AppointmentCategory,
  TermSeason,
} = require("@prisma/client");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();

async function seedBesnyibDoorcard() {
  try {
    console.log("🔍 Looking for user besnyib...");

    // Find the user first
    let user = await prisma.user.findUnique({
      where: { username: "besnyib" },
      include: { Doorcard: true },
    });

    if (!user) {
      console.log("❌ User besnyib not found. Creating user...");

      user = await prisma.user.create({
        data: {
          id: randomUUID(),
          username: "besnyib",
          name: "Bryan Besnyi",
          firstName: "Bryan",
          lastName: "Besnyi",
          title: "Professor",
          email: "besnyib@smccd.edu",
          college: College.CSM,
          role: "FACULTY",
          displayFormat: "FULL_WITH_TITLE",
          website: "https://bryan.besnyi.com",
          pronouns: "he/him",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log("✅ Created user:", user.name);
    } else {
      console.log("✅ Found user:", user.name);
    }

    // Check if user already has an active doorcard
    const existingDoorcard = await prisma.doorcard.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    if (existingDoorcard) {
      console.log(
        "⚠️  User already has an active doorcard:",
        existingDoorcard.name
      );
      return;
    }

    console.log("🚀 Creating doorcard for", user.name);

    // Create doorcard
    const doorcard = await prisma.doorcard.create({
      data: {
        id: randomUUID(),
        name: "Bryan Besnyi - Fall 2024",
        doorcardName: "Bryan Besnyi",
        officeNumber: "CSM-123",
        term: TermSeason.FALL,
        year: 2024,
        college: College.CSM,
        isActive: true,
        isPublic: true,
        slug: "bryan-besnyi-fall-2024",
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("📅 Creating sample schedule...");

    // Create sample appointments
    const appointments = [
      {
        id: randomUUID(),
        name: "CS 134 - Data Structures",
        startTime: "09:00",
        endTime: "10:30",
        dayOfWeek: DayOfWeek.MONDAY,
        category: AppointmentCategory.LECTURE,
        location: "CSM Room 15-220",
        doorcardId: doorcard.id,
      },
      {
        id: randomUUID(),
        name: "CS 134 - Data Structures",
        startTime: "09:00",
        endTime: "10:30",
        dayOfWeek: DayOfWeek.WEDNESDAY,
        category: AppointmentCategory.LECTURE,
        location: "CSM Room 15-220",
        doorcardId: doorcard.id,
      },
      {
        id: randomUUID(),
        name: "CS 134 - Data Structures",
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
        name: "CS 134 Lab",
        startTime: "11:00",
        endTime: "13:00",
        dayOfWeek: DayOfWeek.TUESDAY,
        category: AppointmentCategory.LAB,
        location: "CSM Computer Lab 15-110",
        doorcardId: doorcard.id,
      },
      {
        id: randomUUID(),
        name: "CS 270 Lab",
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
        name: "Department Meeting",
        startTime: "16:00",
        endTime: "17:30",
        dayOfWeek: DayOfWeek.THURSDAY,
        category: AppointmentCategory.REFERENCE,
        location: "CSM Faculty Lounge",
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

    console.log("✅ Created", appointments.length, "appointments");
    console.log("🎉 Doorcard created successfully!");
    console.log(
      "📊 Access your doorcard at: http://localhost:3000/view/besnyib/fall-2024"
    );
  } catch (error) {
    console.error("❌ Error creating doorcard:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBesnyibDoorcard();
