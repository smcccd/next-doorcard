#!/usr/bin/env npx ts-node

import {
  PrismaClient,
  College,
  TermSeason,
  DayOfWeek,
  AppointmentCategory,
  UserRole,
  DisplayNameFormat,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

// Realistic faculty names and departments
const FACULTY_DATA = [
  {
    firstName: "Sarah",
    lastName: "Chen",
    department: "Computer Science",
    title: "Professor",
    college: "CSM",
  },
  {
    firstName: "Michael",
    lastName: "Rodriguez",
    department: "Mathematics",
    title: "Associate Professor",
    college: "SKYLINE",
  },
  {
    firstName: "Jennifer",
    lastName: "Thompson",
    department: "English",
    title: "Assistant Professor",
    college: "CANADA",
  },
  {
    firstName: "David",
    lastName: "Kim",
    department: "Biology",
    title: "Professor",
    college: "CSM",
  },
  {
    firstName: "Maria",
    lastName: "Gonzalez",
    department: "Psychology",
    title: "Lecturer",
    college: "SKYLINE",
  },
  {
    firstName: "Robert",
    lastName: "Johnson",
    department: "History",
    title: "Professor",
    college: "CANADA",
  },
  {
    firstName: "Lisa",
    lastName: "Wang",
    department: "Chemistry",
    title: "Associate Professor",
    college: "CSM",
  },
  {
    firstName: "James",
    lastName: "Brown",
    department: "Physics",
    title: "Professor",
    college: "SKYLINE",
  },
  {
    firstName: "Emily",
    lastName: "Davis",
    department: "Art",
    title: "Assistant Professor",
    college: "CANADA",
  },
  {
    firstName: "Christopher",
    lastName: "Miller",
    department: "Business",
    title: "Lecturer",
    college: "CSM",
  },
  {
    firstName: "Amanda",
    lastName: "Wilson",
    department: "Nursing",
    title: "Clinical Instructor",
    college: "SKYLINE",
  },
  {
    firstName: "Daniel",
    lastName: "Anderson",
    department: "Engineering",
    title: "Professor",
    college: "CANADA",
  },
  {
    firstName: "Michelle",
    lastName: "Taylor",
    department: "Sociology",
    title: "Associate Professor",
    college: "CSM",
  },
  {
    firstName: "Kevin",
    lastName: "Thomas",
    department: "Music",
    title: "Assistant Professor",
    college: "SKYLINE",
  },
  {
    firstName: "Rachel",
    lastName: "Martinez",
    department: "Philosophy",
    title: "Professor",
    college: "CANADA",
  },

  // Additional diverse names
  {
    firstName: "Priya",
    lastName: "Patel",
    department: "Computer Science",
    title: "Assistant Professor",
    college: "CSM",
  },
  {
    firstName: "Ahmed",
    lastName: "Hassan",
    department: "Mathematics",
    title: "Professor",
    college: "SKYLINE",
  },
  {
    firstName: "Elena",
    lastName: "Volkov",
    department: "Languages",
    title: "Lecturer",
    college: "CANADA",
  },
  {
    firstName: "Hiroshi",
    lastName: "Tanaka",
    department: "Physics",
    title: "Associate Professor",
    college: "CSM",
  },
  {
    firstName: "Fatima",
    lastName: "Al-Rashid",
    department: "Chemistry",
    title: "Professor",
    college: "SKYLINE",
  },
  {
    firstName: "Carlos",
    lastName: "Mendoza",
    department: "Biology",
    title: "Assistant Professor",
    college: "CANADA",
  },
  {
    firstName: "Aisha",
    lastName: "Johnson-Smith",
    department: "Psychology",
    title: "Clinical Instructor",
    college: "CSM",
  },
  {
    firstName: "Vladimir",
    lastName: "Petrov",
    department: "Engineering",
    title: "Professor",
    college: "SKYLINE",
  },
  {
    firstName: "Mei-Lin",
    lastName: "Chang",
    department: "Art",
    title: "Associate Professor",
    college: "CANADA",
  },
  {
    firstName: "Ibrahim",
    lastName: "Mohamed",
    department: "Business",
    title: "Lecturer",
    college: "CSM",
  },
];

const PRONOUNS = ["", "he/him", "she/her", "they/them", "he/they", "she/they"];
const DISPLAY_FORMATS: DisplayNameFormat[] = [
  "FULL_NAME",
  "FULL_WITH_TITLE",
  "LAST_WITH_TITLE",
  "FIRST_INITIAL_LAST",
];

// Complex schedule patterns
const SCHEDULE_PATTERNS = [
  // Standard office hours
  {
    name: "Standard Office Hours",
    appointments: [
      {
        name: "Office Hours",
        day: "TUESDAY",
        start: "10:00",
        end: "12:00",
        category: "OFFICE_HOURS",
      },
      {
        name: "Office Hours",
        day: "THURSDAY",
        start: "14:00",
        end: "16:00",
        category: "OFFICE_HOURS",
      },
    ],
  },

  // Off-hours schedule
  {
    name: "Off-Hours Schedule",
    appointments: [
      {
        name: "Evening Office Hours",
        day: "MONDAY",
        start: "18:00",
        end: "20:00",
        category: "OFFICE_HOURS",
      },
      {
        name: "Early Morning Hours",
        day: "FRIDAY",
        start: "07:00",
        end: "09:00",
        category: "OFFICE_HOURS",
      },
    ],
  },

  // Weekend availability
  {
    name: "Weekend Office Hours",
    appointments: [
      {
        name: "Saturday Study Session",
        day: "SATURDAY",
        start: "10:00",
        end: "14:00",
        category: "OFFICE_HOURS",
      },
      {
        name: "Sunday Review",
        day: "SUNDAY",
        start: "13:00",
        end: "16:00",
        category: "OFFICE_HOURS",
      },
    ],
  },

  // Complex teaching schedule
  {
    name: "Complex Teaching Load",
    appointments: [
      {
        name: "CS 101 Lecture",
        day: "MONDAY",
        start: "09:00",
        end: "10:30",
        category: "LECTURE",
      },
      {
        name: "CS 101 Lab",
        day: "MONDAY",
        start: "11:00",
        end: "13:00",
        category: "LAB",
      },
      {
        name: "Office Hours",
        day: "MONDAY",
        start: "14:00",
        end: "16:00",
        category: "OFFICE_HOURS",
      },
      {
        name: "CS 201 Lecture",
        day: "WEDNESDAY",
        start: "09:00",
        end: "10:30",
        category: "LECTURE",
      },
      {
        name: "CS 201 Lab",
        day: "WEDNESDAY",
        start: "11:00",
        end: "13:00",
        category: "LAB",
      },
      {
        name: "Office Hours",
        day: "WEDNESDAY",
        start: "14:00",
        end: "16:00",
        category: "OFFICE_HOURS",
      },
      {
        name: "Faculty Meeting",
        day: "FRIDAY",
        start: "10:00",
        end: "12:00",
        category: "OTHER",
      },
    ],
  },

  // By appointment only
  {
    name: "By Appointment Only",
    appointments: [
      {
        name: "Hours by Arrangement",
        day: "TUESDAY",
        start: "10:00",
        end: "17:00",
        category: "HOURS_BY_ARRANGEMENT",
      },
      {
        name: "Research Consultation",
        day: "THURSDAY",
        start: "13:00",
        end: "17:00",
        category: "HOURS_BY_ARRANGEMENT",
      },
    ],
  },

  // Minimal schedule
  {
    name: "Minimal Availability",
    appointments: [
      {
        name: "Brief Office Hours",
        day: "WEDNESDAY",
        start: "12:00",
        end: "13:00",
        category: "OFFICE_HOURS",
      },
    ],
  },

  // Heavy course load
  {
    name: "Heavy Teaching Load",
    appointments: [
      {
        name: "Math 101",
        day: "MONDAY",
        start: "08:00",
        end: "09:30",
        category: "LECTURE",
      },
      {
        name: "Math 102",
        day: "MONDAY",
        start: "10:00",
        end: "11:30",
        category: "LECTURE",
      },
      {
        name: "Math 103",
        day: "MONDAY",
        start: "13:00",
        end: "14:30",
        category: "LECTURE",
      },
      {
        name: "Math 101",
        day: "WEDNESDAY",
        start: "08:00",
        end: "09:30",
        category: "LECTURE",
      },
      {
        name: "Math 102",
        day: "WEDNESDAY",
        start: "10:00",
        end: "11:30",
        category: "LECTURE",
      },
      {
        name: "Math 103",
        day: "WEDNESDAY",
        start: "13:00",
        end: "14:30",
        category: "LECTURE",
      },
      {
        name: "Office Hours",
        day: "TUESDAY",
        start: "11:00",
        end: "12:00",
        category: "OFFICE_HOURS",
      },
      {
        name: "Office Hours",
        day: "THURSDAY",
        start: "11:00",
        end: "12:00",
        category: "OFFICE_HOURS",
      },
    ],
  },
];

async function createDiverseFacultyUser(
  facultyData: (typeof FACULTY_DATA)[0],
  index: number
) {
  const username = `${facultyData.firstName.toLowerCase()}${facultyData.lastName.toLowerCase().replace(/[-\s]/g, "")}`;
  const email = `${username}@smccd.edu`;

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`⏭️  User ${email} already exists`);
    return existing;
  }

  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email,
      username,
      name: `${facultyData.firstName} ${facultyData.lastName}`,
      firstName: facultyData.firstName,
      lastName: facultyData.lastName,
      title: facultyData.title,
      pronouns: PRONOUNS[Math.floor(Math.random() * PRONOUNS.length)] || null,
      displayFormat:
        DISPLAY_FORMATS[Math.floor(Math.random() * DISPLAY_FORMATS.length)],
      password: await bcrypt.hash("changeme123", 10),
      role: "FACULTY",
      college: facultyData.college as College,
      website:
        Math.random() > 0.7 ? `https://${username}.faculty.smccd.edu` : null,
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Created user: ${user.name} (${user.email})`);
  return user;
}

async function createFacultyDoorcard(
  user: any,
  facultyData: (typeof FACULTY_DATA)[0]
) {
  // Create Fall 2025 doorcard
  const doorcard = await prisma.doorcard.create({
    data: {
      id: crypto.randomUUID(),
      name: user.name,
      doorcardName: `${facultyData.title} ${user.firstName} ${user.lastName}`,
      officeNumber: `${facultyData.college}${Math.floor(Math.random() * 999) + 100}`,
      term: "FALL" as TermSeason,
      year: 2025,
      college: facultyData.college as College,
      isActive: true,
      isPublic: Math.random() > 0.1, // 90% public
      userId: user.id,
      updatedAt: new Date(),
    },
  });

  console.log(`📄 Created doorcard: ${doorcard.doorcardName}`);
  return doorcard;
}

async function createScheduleForDoorcard(doorcard: any, patternIndex: number) {
  const pattern = SCHEDULE_PATTERNS[patternIndex % SCHEDULE_PATTERNS.length];
  const appointmentsCreated = [];

  for (const apt of pattern.appointments) {
    const appointment = await prisma.appointment.create({
      data: {
        id: crypto.randomUUID(),
        name: apt.name,
        startTime: apt.start,
        endTime: apt.end,
        dayOfWeek: apt.day as DayOfWeek,
        category: apt.category as AppointmentCategory,
        location:
          Math.random() > 0.8
            ? `Room ${Math.floor(Math.random() * 999) + 100}`
            : null,
        doorcardId: doorcard.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    appointmentsCreated.push(appointment);
  }

  console.log(
    `🕐 Added ${appointmentsCreated.length} appointments (${pattern.name})`
  );
  return appointmentsCreated;
}

async function generateAdditionalFaculty() {
  console.log("🎭 Generating additional diverse faculty...");

  const departments = [
    "Computer Science",
    "Mathematics",
    "English",
    "Biology",
    "Chemistry",
    "Physics",
    "History",
    "Psychology",
    "Art",
    "Music",
    "Business",
    "Nursing",
    "Engineering",
  ];
  const firstNames = [
    "Alex",
    "Jordan",
    "Taylor",
    "Casey",
    "Morgan",
    "Riley",
    "Avery",
    "Quinn",
    "Sage",
    "River",
    "Phoenix",
    "Skylar",
    "Cameron",
    "Dakota",
    "Emery",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Wilson",
    "Moore",
    "Anderson",
    "Jackson",
    "White",
    "Thompson",
    "Lee",
  ];
  const titles = [
    "Professor",
    "Associate Professor",
    "Assistant Professor",
    "Lecturer",
    "Clinical Instructor",
    "Adjunct Professor",
  ];
  const colleges = ["CSM", "SKYLINE", "CANADA"];

  const additionalFaculty = [];

  for (let i = 0; i < 75; i++) {
    // Generate 75 additional faculty
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const department =
      departments[Math.floor(Math.random() * departments.length)];
    const title = titles[Math.floor(Math.random() * titles.length)];
    const college = colleges[Math.floor(Math.random() * colleges.length)];

    additionalFaculty.push({
      firstName: `${firstName}${i > 50 ? i : ""}`, // Add numbers to avoid duplicates
      lastName,
      department,
      title,
      college,
    });
  }

  return additionalFaculty;
}

async function main() {
  console.log("🚀 Creating Diverse Fall 2025 Faculty Data");
  console.log("==========================================");

  try {
    // Create the base faculty from our curated list
    console.log("📚 Creating curated faculty...");
    for (let i = 0; i < FACULTY_DATA.length; i++) {
      const facultyData = FACULTY_DATA[i];
      const user = await createDiverseFacultyUser(facultyData, i);
      const doorcard = await createFacultyDoorcard(user, facultyData);
      await createScheduleForDoorcard(doorcard, i);
    }

    // Create additional diverse faculty
    console.log("🎲 Creating additional diverse faculty...");
    const additionalFaculty = await generateAdditionalFaculty();

    for (let i = 0; i < additionalFaculty.length; i++) {
      const facultyData = additionalFaculty[i];
      const user = await createDiverseFacultyUser(
        facultyData,
        i + FACULTY_DATA.length
      );
      const doorcard = await createFacultyDoorcard(user, facultyData);
      await createScheduleForDoorcard(doorcard, i);
    }

    // Summary
    const totalUsers = FACULTY_DATA.length + additionalFaculty.length;
    console.log("\n✅ Fall 2025 Development Data Created Successfully!");
    console.log(`👥 Total Faculty: ${totalUsers}`);
    console.log(`📄 Total Doorcards: ${totalUsers}`);
    console.log(
      `🕐 Schedule Variety: ${SCHEDULE_PATTERNS.length} different patterns`
    );
    console.log(`🏫 Colleges: CSM, Skyline, Cañada`);
    console.log(`🎭 Display Formats: ${DISPLAY_FORMATS.length} variations`);
    console.log(`⏰ Time Ranges: Early morning to evening, including weekends`);
  } catch (error) {
    console.error("❌ Error creating diverse faculty:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
