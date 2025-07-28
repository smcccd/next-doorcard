import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Mock faculty data for each campus
const mockFaculty = [
  // Skyline College Faculty
  {
    email: 'sarah.johnson@skyline.edu',
    name: 'Dr. Sarah Johnson',
    firstName: 'Sarah',
    lastName: 'Johnson',
    username: 'sarah-johnson',
    title: 'Professor of Mathematics',
    college: 'SKYLINE',
    officeNumber: 'S7-234',
    departments: ['Mathematics', 'Statistics'],
    doorcardName: 'Dr. Sarah Johnson - Mathematics',
    appointmentTypes: ['Office Hours', 'Math Tutoring', 'By Appointment'],
  },
  {
    email: 'robert.chen@skyline.edu',
    name: 'Prof. Robert Chen',
    firstName: 'Robert',
    lastName: 'Chen',
    username: 'robert-chen',
    title: 'Associate Professor of Computer Science',
    college: 'SKYLINE',
    officeNumber: 'S8-301',
    departments: ['Computer Science', 'Information Technology'],
    doorcardName: 'Prof. Chen - Computer Science',
    appointmentTypes: ['Office Hours', 'CS Lab Help', 'Project Reviews'],
  },
  {
    email: 'maria.garcia@skyline.edu',
    name: 'Dr. Maria Garcia',
    firstName: 'Maria',
    lastName: 'Garcia',
    username: 'maria-garcia',
    title: 'Professor of Biology',
    college: 'SKYLINE',
    officeNumber: 'S7-156',
    departments: ['Biology', 'Environmental Science'],
    doorcardName: 'Dr. Garcia - Biology Department',
    appointmentTypes: ['Office Hours', 'Lab Questions', 'Research Meetings'],
  },

  // College of San Mateo (CSM) Faculty
  {
    email: 'james.williams@csm.edu',
    name: 'Dr. James Williams',
    firstName: 'James',
    lastName: 'Williams',
    username: 'james-williams',
    title: 'Professor of English',
    college: 'CSM',
    officeNumber: 'Building 18-204',
    departments: ['English', 'Creative Writing'],
    doorcardName: 'Dr. Williams - English & Literature',
    appointmentTypes: ['Office Hours', 'Writing Help', 'Essay Reviews'],
  },
  {
    email: 'emily.taylor@csm.edu',
    name: 'Prof. Emily Taylor',
    firstName: 'Emily',
    lastName: 'Taylor',
    username: 'emily-taylor',
    title: 'Associate Professor of Psychology',
    college: 'CSM',
    officeNumber: 'Building 36-319',
    departments: ['Psychology', 'Social Sciences'],
    doorcardName: 'Prof. Taylor - Psychology',
    appointmentTypes: ['Office Hours', 'Advising', 'Research Discussion'],
  },
  {
    email: 'michael.brown@csm.edu',
    name: 'Dr. Michael Brown',
    firstName: 'Michael',
    lastName: 'Brown',
    username: 'michael-brown',
    title: 'Professor of Physics',
    college: 'CSM',
    officeNumber: 'Building 36-245',
    departments: ['Physics', 'Astronomy'],
    doorcardName: 'Dr. Brown - Physics & Astronomy',
    appointmentTypes: ['Office Hours', 'Lab Help', 'Problem Solving Sessions'],
  },

  // Cañada College Faculty
  {
    email: 'lisa.martinez@canada.edu',
    name: 'Dr. Lisa Martinez',
    firstName: 'Lisa',
    lastName: 'Martinez',
    username: 'lisa-martinez',
    title: 'Professor of History',
    college: 'CANADA',
    officeNumber: 'Building 13-215',
    departments: ['History', 'Political Science'],
    doorcardName: 'Dr. Martinez - History Department',
    appointmentTypes: ['Office Hours', 'Thesis Advising', 'Study Groups'],
  },
  {
    email: 'david.lee@canada.edu',
    name: 'Prof. David Lee',
    firstName: 'David',
    lastName: 'Lee',
    username: 'david-lee',
    title: 'Associate Professor of Business',
    college: 'CANADA',
    officeNumber: 'Building 9-135',
    departments: ['Business', 'Economics'],
    doorcardName: 'Prof. Lee - Business Administration',
    appointmentTypes: ['Office Hours', 'Career Advising', 'Project Consultations'],
  },
  {
    email: 'jennifer.wilson@canada.edu',
    name: 'Dr. Jennifer Wilson',
    firstName: 'Jennifer',
    lastName: 'Wilson',
    username: 'jennifer-wilson',
    title: 'Professor of Chemistry',
    college: 'CANADA',
    officeNumber: 'Building 23-150',
    departments: ['Chemistry', 'Biochemistry'],
    doorcardName: 'Dr. Wilson - Chemistry',
    appointmentTypes: ['Office Hours', 'Lab Safety Training', 'Exam Reviews'],
  },
];

// Office hours schedule templates
const officeHoursTemplates = [
  // Template 1: MW mornings
  [
    { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '11:00', appointmentType: 'Office Hours' },
    { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '11:00', appointmentType: 'Office Hours' },
    { dayOfWeek: 'FRIDAY', startTime: '10:00', endTime: '11:00', appointmentType: 'By Appointment' },
  ],
  // Template 2: TTh afternoons
  [
    { dayOfWeek: 'TUESDAY', startTime: '14:00', endTime: '16:00', appointmentType: 'Office Hours' },
    { dayOfWeek: 'THURSDAY', startTime: '14:00', endTime: '16:00', appointmentType: 'Office Hours' },
    { dayOfWeek: 'MONDAY', startTime: '15:00', endTime: '16:00', appointmentType: 'Lab Help' },
  ],
  // Template 3: MWF mixed
  [
    { dayOfWeek: 'MONDAY', startTime: '11:00', endTime: '12:00', appointmentType: 'Office Hours' },
    { dayOfWeek: 'WEDNESDAY', startTime: '13:00', endTime: '15:00', appointmentType: 'Office Hours' },
    { dayOfWeek: 'FRIDAY', startTime: '11:00', endTime: '12:30', appointmentType: 'Study Groups' },
  ],
  // Template 4: TTh mornings
  [
    { dayOfWeek: 'TUESDAY', startTime: '10:00', endTime: '12:00', appointmentType: 'Office Hours' },
    { dayOfWeek: 'THURSDAY', startTime: '10:00', endTime: '12:00', appointmentType: 'Office Hours' },
    { dayOfWeek: 'WEDNESDAY', startTime: '11:00', endTime: '12:00', appointmentType: 'By Appointment' },
  ],
];

async function seedMockUsers() {
  console.log('🌱 Starting to seed mock users for Fall 2025...\n');

  try {
    // First, ensure we have the Fall 2025 term
    const fall2025 = await prisma.term.upsert({
      where: {
        name: 'Fall 2025',
      },
      update: {
        isActive: true,
        isArchived: false,
        isUpcoming: false,
      },
      create: {
        name: 'Fall 2025',
        year: '2025',
        season: 'Fall',
        startDate: new Date('2025-08-19'),
        endDate: new Date('2025-12-20'),
        isActive: true,
        isArchived: false,
        isUpcoming: false,
      },
    });

    console.log('✅ Fall 2025 term created/updated\n');

    // Set other terms as inactive
    await prisma.term.updateMany({
      where: {
        name: {
          not: 'Fall 2025',
        },
      },
      data: {
        isActive: false,
      },
    });

    console.log('✅ Other terms set as inactive\n');

    // Create users and doorcards
    for (let i = 0; i < mockFaculty.length; i++) {
      const faculty = mockFaculty[i];
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      console.log(`Creating ${faculty.name} (${faculty.college})...`);

      // Create or update user
      const user = await prisma.user.upsert({
        where: { email: faculty.email },
        update: {
          name: faculty.name,
          firstName: faculty.firstName,
          lastName: faculty.lastName,
          username: faculty.username,
          title: faculty.title,
          college: faculty.college,
          role: 'FACULTY',
        },
        create: {
          email: faculty.email,
          name: faculty.name,
          firstName: faculty.firstName,
          lastName: faculty.lastName,
          username: faculty.username,
          title: faculty.title,
          college: faculty.college,
          password: hashedPassword,
          role: 'FACULTY',
          emailVerified: new Date(),
        },
      });

      // Create doorcard for Fall 2025
      const slug = `${faculty.username}-fall-2025`;
      
      // Delete any existing doorcard with this slug
      await prisma.doorcard.deleteMany({
        where: { slug },
      });

      const doorcard = await prisma.doorcard.create({
        data: {
          userId: user.id,
          term: 'FALL',
          year: 2025,
          officeNumber: faculty.officeNumber,
          name: faculty.name,
          doorcardName: faculty.doorcardName,
          college: faculty.college,
          isActive: true,
          isPublic: true,
          slug,
          termId: fall2025.id,
        },
      });

      // Add office hours using templates
      const template = officeHoursTemplates[i % officeHoursTemplates.length];
      const appointmentTypes = faculty.appointmentTypes;
      
      for (let j = 0; j < template.length; j++) {
        const hour = template[j];
        await prisma.appointment.create({
          data: {
            doorcardId: doorcard.id,
            name: appointmentTypes[j % appointmentTypes.length],
            dayOfWeek: hour.dayOfWeek,
            startTime: hour.startTime,
            endTime: hour.endTime,
            location: faculty.officeNumber,
            category: hour.appointmentType === 'By Appointment' ? 'HOURS_BY_ARRANGEMENT' : 'OFFICE_HOURS',
          },
        });
      }

      console.log(`✅ Created ${faculty.name} with ${template.length} office hours\n`);
    }

    // Get summary
    const userCount = await prisma.user.count();
    const doorcardCount = await prisma.doorcard.count({
      where: { term: 'FALL', year: 2025 },
    });
    const skylineCount = await prisma.doorcard.count({
      where: { term: 'FALL', year: 2025, college: 'SKYLINE' },
    });
    const csmCount = await prisma.doorcard.count({
      where: { term: 'FALL', year: 2025, college: 'CSM' },
    });
    const canadaCount = await prisma.doorcard.count({
      where: { term: 'FALL', year: 2025, college: 'CANADA' },
    });

    console.log('\n📊 Seeding Summary:');
    console.log('=====================================');
    console.log(`Total Users: ${userCount}`);
    console.log(`Fall 2025 Doorcards: ${doorcardCount}`);
    console.log(`  - Skyline College: ${skylineCount}`);
    console.log(`  - College of San Mateo: ${csmCount}`);
    console.log(`  - Cañada College: ${canadaCount}`);
    console.log('=====================================\n');

    console.log('🎉 Mock users seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('  Email: any of the above emails');
    console.log('  Password: password123');
    console.log('\n🔍 You can now test the campus filters on the homepage!');

  } catch (error) {
    console.error('❌ Error seeding mock users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedMockUsers()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });