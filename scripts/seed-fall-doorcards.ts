import {
  PrismaClient,
  College,
  DayOfWeek,
  AppointmentCategory,
  TermSeason,
  UserRole,
} from "@prisma/client";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

// Mock faculty data
const facultyData = [
  {
    name: "Dr. Sarah Chen",
    username: "chens",
    department: "Mathematics",
    college: "SKYLINE",
  },
  {
    name: "Prof. Michael Rodriguez",
    username: "rodriguezm",
    department: "English",
    college: "CSM",
  },
  {
    name: "Dr. Jennifer Park",
    username: "parkj",
    department: "Biology",
    college: "CANADA",
  },
  {
    name: "Prof. David Thompson",
    username: "thompsond",
    department: "History",
    college: "SKYLINE",
  },
  {
    name: "Dr. Maria Garcia",
    username: "garciam",
    department: "Chemistry",
    college: "CSM",
  },
  {
    name: "Prof. James Wilson",
    username: "wilsonj",
    department: "Psychology",
    college: "CANADA",
  },
  {
    name: "Dr. Lisa Anderson",
    username: "andersonl",
    department: "Physics",
    college: "SKYLINE",
  },
  {
    name: "Prof. Robert Lee",
    username: "leer",
    department: "Art",
    college: "CSM",
  },
  {
    name: "Dr. Emily Davis",
    username: "davise",
    department: "Sociology",
    college: "CANADA",
  },
  {
    name: "Prof. Kevin Brown",
    username: "brownk",
    department: "Computer Science",
    college: "SKYLINE",
  },
  {
    name: "Dr. Amanda White",
    username: "whitea",
    department: "Philosophy",
    college: "CSM",
  },
  {
    name: "Prof. Daniel Martinez",
    username: "martinezd",
    department: "Business",
    college: "CANADA",
  },
  {
    name: "Dr. Rachel Kim",
    username: "kimr",
    department: "Nursing",
    college: "SKYLINE",
  },
  {
    name: "Prof. Christopher Taylor",
    username: "taylorc",
    department: "Engineering",
    college: "CSM",
  },
  {
    name: "Dr. Nicole Johnson",
    username: "johnsonn",
    department: "Economics",
    college: "CANADA",
  },
  {
    name: "Prof. Steven Miller",
    username: "millers",
    department: "Music",
    college: "SKYLINE",
  },
  {
    name: "Dr. Jessica Wong",
    username: "wongj",
    department: "Anthropology",
    college: "CSM",
  },
  {
    name: "Prof. Matthew Clark",
    username: "clarkm",
    department: "Political Science",
    college: "CANADA",
  },
  {
    name: "Dr. Laura Adams",
    username: "adamsl",
    department: "Theatre",
    college: "SKYLINE",
  },
  {
    name: "Prof. Andrew Scott",
    username: "scotta",
    department: "Geography",
    college: "CSM",
  },
  {
    name: "Dr. Stephanie Green",
    username: "greens",
    department: "Communications",
    college: "CANADA",
  },
  {
    name: "Prof. Thomas Hall",
    username: "hallt",
    department: "Kinesiology",
    college: "SKYLINE",
  },
  {
    name: "Dr. Melissa Turner",
    username: "turnerm",
    department: "French",
    college: "CSM",
  },
  {
    name: "Prof. Jonathan Baker",
    username: "bakerj",
    department: "Accounting",
    college: "CANADA",
  },
  {
    name: "Dr. Samantha Phillips",
    username: "phillipss",
    department: "Environmental Science",
    college: "SKYLINE",
  },
  {
    name: "Prof. Paul Mitchell",
    username: "mitchellp",
    department: "Spanish",
    college: "CSM",
  },
  {
    name: "Dr. Rebecca Collins",
    username: "collinsr",
    department: "Marketing",
    college: "CANADA",
  },
  {
    name: "Prof. Brian Lewis",
    username: "lewisb",
    department: "Astronomy",
    college: "SKYLINE",
  },
  {
    name: "Dr. Kimberly Roberts",
    username: "robertsk",
    department: "Education",
    college: "CSM",
  },
  {
    name: "Prof. Gary Nelson",
    username: "nelsong",
    department: "Culinary Arts",
    college: "CANADA",
  },
  {
    name: "Dr. Elizabeth Carter",
    username: "cartere",
    department: "Social Work",
    college: "SKYLINE",
  },
  {
    name: "Prof. Richard Evans",
    username: "evansr",
    department: "Architecture",
    college: "CSM",
  },
  {
    name: "Dr. Helen Rodriguez",
    username: "rodriguezh",
    department: "Library Science",
    college: "CANADA",
  },
  {
    name: "Prof. Mark Williams",
    username: "williamsm",
    department: "Journalism",
    college: "SKYLINE",
  },
  {
    name: "Dr. Angela Thompson",
    username: "thompsona",
    department: "Geology",
    college: "CSM",
  },
  {
    name: "Prof. Peter Davis",
    username: "davisp",
    department: "Statistics",
    college: "CANADA",
  },
  {
    name: "Dr. Cynthia Moore",
    username: "moorec",
    department: "Linguistics",
    college: "SKYLINE",
  },
  {
    name: "Prof. Timothy Jackson",
    username: "jacksont",
    department: "Film Studies",
    college: "CSM",
  },
  {
    name: "Dr. Sharon Garcia",
    username: "garcias",
    department: "Public Health",
    college: "CANADA",
  },
  {
    name: "Prof. Joseph Martinez",
    username: "martinezj",
    department: "Philosophy",
    college: "SKYLINE",
  },
  {
    name: "Dr. Diana Kim",
    username: "kimd",
    department: "Graphic Design",
    college: "CSM",
  },
  {
    name: "Prof. Kenneth Lee",
    username: "leek",
    department: "Criminal Justice",
    college: "CANADA",
  },
  {
    name: "Dr. Carolyn White",
    username: "whitec",
    department: "Nutrition",
    college: "SKYLINE",
  },
  {
    name: "Prof. Edward Brown",
    username: "browne",
    department: "Photography",
    college: "CSM",
  },
  {
    name: "Dr. Patricia Johnson",
    username: "johnsonp",
    department: "Human Services",
    college: "CANADA",
  },
  {
    name: "Prof. Frank Wilson",
    username: "wilsonf",
    department: "Agriculture",
    college: "SKYLINE",
  },
  {
    name: "Dr. Janet Anderson",
    username: "andersonj",
    department: "Fashion Design",
    college: "CSM",
  },
  {
    name: "Prof. Arthur Taylor",
    username: "taylora",
    department: "Real Estate",
    college: "CANADA",
  },
  {
    name: "Dr. Judith Miller",
    username: "millerj",
    department: "Paralegal",
    college: "SKYLINE",
  },
  {
    name: "Prof. Dennis Clark",
    username: "clarkd",
    department: "Automotive",
    college: "CSM",
  },
];

const officeHours = [
  { day: DayOfWeek.MONDAY, startTime: "09:00", endTime: "11:00" },
  { day: DayOfWeek.TUESDAY, startTime: "14:00", endTime: "16:00" },
  { day: DayOfWeek.WEDNESDAY, startTime: "10:00", endTime: "12:00" },
  { day: DayOfWeek.THURSDAY, startTime: "13:00", endTime: "15:00" },
  { day: DayOfWeek.FRIDAY, startTime: "11:00", endTime: "14:00" },
  { day: DayOfWeek.MONDAY, startTime: "15:00", endTime: "17:00" },
  { day: DayOfWeek.WEDNESDAY, startTime: "09:00", endTime: "12:00" },
];

async function main() {
  console.log("🌱 Starting Fall 2025 doorcard seeding...");

  // Create users and doorcards
  for (let i = 0; i < 50; i++) {
    const faculty = facultyData[i];

    try {
      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { username: faculty.username },
      });

      if (!user) {
        // Create user
        const hashedPassword = await hash("changeme123", 12);
        user = await prisma.user.create({
          data: {
            id: randomUUID(),
            username: faculty.username,
            email: `${faculty.username}@smccd.edu`,
            name: faculty.name,
            password: hashedPassword,
            role: UserRole.FACULTY,
            updatedAt: new Date(),
          },
        });
      }

      // Create doorcard
      const doorcard = await prisma.doorcard.create({
        data: {
          id: randomUUID(),
          name: `${faculty.name} - ${faculty.department}`,
          doorcardName: `${faculty.name} - ${faculty.department}`,
          officeNumber: `Building ${Math.floor(Math.random() * 20) + 1}, Room ${Math.floor(Math.random() * 300) + 100}`,
          userId: user.id,
          college: faculty.college as College,
          term: TermSeason.FALL,
          year: 2025,
          isActive: true,
          isPublic: true,
          updatedAt: new Date(),
        },
      });

      // Create 2-3 appointments per doorcard
      const numAppointments = Math.floor(Math.random() * 2) + 2;
      for (let j = 0; j < numAppointments; j++) {
        const hours =
          officeHours[Math.floor(Math.random() * officeHours.length)];

        await prisma.appointment.create({
          data: {
            id: randomUUID(),
            doorcardId: doorcard.id,
            name: `Office Hours - ${faculty.department}`,
            dayOfWeek: hours.day,
            startTime: hours.startTime,
            endTime: hours.endTime,
            location: doorcard.officeNumber,
            category: AppointmentCategory.OFFICE_HOURS,
            updatedAt: new Date(),
          },
        });
      }

      console.log(
        `✅ Created doorcard for ${faculty.name} (${faculty.college})`
      );
    } catch (error) {
      console.error(`❌ Error creating doorcard for ${faculty.name}:`, error);
    }
  }

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
