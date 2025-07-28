const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeDatabase() {
  try {
    console.log('🔍 DATABASE ANALYSIS REPORT');
    console.log('='.repeat(50));
    
    // Basic counts
    const userCount = await prisma.user.count();
    const doorcardCount = await prisma.doorcard.count();
    const appointmentCount = await prisma.appointment.count();
    const termCount = await prisma.term.count();
    
    console.log(`\n📊 RECORD COUNTS:`);
    console.log(`Users: ${userCount}`);
    console.log(`Doorcards: ${doorcardCount}`);
    console.log(`Appointments: ${appointmentCount}`);
    console.log(`Terms: ${termCount}`);
    
    // Users analysis
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });
    
    const usersByCollege = await prisma.user.groupBy({
      by: ['college'],
      _count: { college: true }
    });
    
    console.log(`\n👥 USERS BY ROLE:`);
    usersByRole.forEach(group => {
      console.log(`${group.role}: ${group._count.role}`);
    });
    
    console.log(`\n🏫 USERS BY COLLEGE:`);
    usersByCollege.forEach(group => {
      console.log(`${group.college || 'NULL'}: ${group._count.college}`);
    });
    
    // Doorcards analysis
    const doorcardsByCollege = await prisma.doorcard.groupBy({
      by: ['college'],
      _count: { college: true }
    });
    
    const doorcardsByTerm = await prisma.doorcard.groupBy({
      by: ['term', 'year'],
      _count: { term: true },
      orderBy: [{ year: 'desc' }, { term: 'asc' }]
    });
    
    console.log(`\n📋 DOORCARDS BY COLLEGE:`);
    doorcardsByCollege.forEach(group => {
      console.log(`${group.college}: ${group._count.college}`);
    });
    
    console.log(`\n📅 DOORCARDS BY TERM/YEAR (Top 10):`);
    doorcardsByTerm.slice(0, 10).forEach(group => {
      console.log(`${group.term} ${group.year}: ${group._count.term}`);
    });
    
    // Data quality checks
    console.log(`\n🔍 DATA QUALITY CHECKS:`);
    
    // Users without usernames
    const usersWithoutUsername = await prisma.user.count({
      where: { username: null }
    });
    console.log(`Users without username: ${usersWithoutUsername}`);
    
    // Users with duplicate emails
    const duplicateEmails = await prisma.user.groupBy({
      by: ['email'],
      _count: { email: true },
      having: { email: { _count: { gt: 1 } } }
    });
    console.log(`Duplicate email addresses: ${duplicateEmails.length}`);
    
    // Check for invalid foreign keys by joining
    const orphanedDoorcardsQuery = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Doorcard" d 
      LEFT JOIN "User" u ON d."userId" = u.id 
      WHERE u.id IS NULL
    `;
    const orphanedDoorcards = Number(orphanedDoorcardsQuery[0].count);
    console.log(`Doorcards without valid users: ${orphanedDoorcards}`);
    
    const orphanedAppointmentsQuery = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Appointment" a 
      LEFT JOIN "Doorcard" d ON a."doorcardId" = d.id 
      WHERE d.id IS NULL
    `;
    const orphanedAppointments = Number(orphanedAppointmentsQuery[0].count);
    console.log(`Appointments without valid doorcards: ${orphanedAppointments}`);
    
    // Invalid time ranges
    const invalidTimeAppointments = await prisma.appointment.findMany({
      where: {
        OR: [
          { startTime: "" },
          { endTime: "" },
          { startTime: null },
          { endTime: null }
        ]
      },
      take: 5
    });
    console.log(`Appointments with invalid times: ${invalidTimeAppointments.length}`);
    
    // Sample some data for inspection
    console.log(`\n📋 SAMPLE DATA:`);
    
    const sampleUsers = await prisma.user.findMany({
      take: 3,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        college: true,
        name: true
      }
    });
    
    console.log('\nSample Users:');
    sampleUsers.forEach(user => {
      console.log(`  ${user.username || 'NO_USERNAME'} (${user.email}) - ${user.role} at ${user.college || 'NO_COLLEGE'}`);
    });
    
    const sampleDoorcards = await prisma.doorcard.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        term: true,
        year: true,
        college: true,
        user: {
          select: { username: true }
        }
      }
    });
    
    console.log('\nSample Doorcards:');
    sampleDoorcards.forEach(doorcard => {
      console.log(`  "${doorcard.name}" - ${doorcard.term} ${doorcard.year} at ${doorcard.college} (User: ${doorcard.user?.username || 'NO_USER'})`);
    });
    
    // Check for business logic violations
    console.log(`\n⚠️  POTENTIAL ISSUES:`);
    
    // Check for impossible years
    const futureDoorcards = await prisma.doorcard.count({
      where: { year: { gt: new Date().getFullYear() + 2 } }
    });
    console.log(`Doorcards with far future years: ${futureDoorcards}`);
    
    const pastDoorcards = await prisma.doorcard.count({
      where: { year: { lt: 2000 } }
    });
    console.log(`Doorcards with years before 2000: ${pastDoorcards}`);
    
    // Check for placeholder doorcards
    const placeholderDoorcards = await prisma.doorcard.count({
      where: { name: { contains: 'Legacy Doorcard' } }
    });
    console.log(`Placeholder doorcards created: ${placeholderDoorcards}`);
    
    // Check for very long appointment times
    const longAppointments = await prisma.appointment.findMany({
      where: {
        AND: [
          { startTime: { not: "" } },
          { endTime: { not: "" } }
        ]
      },
      take: 1000
    });
    
    let invalidTimeRanges = 0;
    longAppointments.forEach(apt => {
      const start = apt.startTime.split(':').map(n => parseInt(n));
      const end = apt.endTime.split(':').map(n => parseInt(n));
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];
      
      if (endMinutes <= startMinutes || endMinutes - startMinutes > 480) { // More than 8 hours
        invalidTimeRanges++;
      }
    });
    console.log(`Appointments with invalid time ranges: ${invalidTimeRanges}`);
    
  } catch (error) {
    console.error('Error analyzing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDatabase();