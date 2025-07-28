import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function sampleDataCheck() {
  console.log('🔍 Sample Data Check');
  console.log('='.repeat(50));

  // Get a few sample users
  const sampleUsers = await prisma.user.findMany({
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      college: true,
    }
  });

  console.log('\n👥 Sample Users:');
  sampleUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name || user.email} - Campus: ${user.college || 'NO CAMPUS'}`);
  });

  // Get a few sample doorcards
  const sampleDoorcards = await prisma.doorcard.findMany({
    take: 5,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          college: true
        }
      }
    }
  });

  console.log('\n🚪 Sample Doorcards:');
  sampleDoorcards.forEach((doorcard, index) => {
    console.log(`${index + 1}. ${doorcard.name} (${doorcard.term} ${doorcard.year})`);
    console.log(`   User Campus: ${doorcard.user.college || 'NO CAMPUS'}`);
    console.log(`   Doorcard Campus: ${doorcard.college}`);
    console.log('   ---');
  });

  // Check total counts
  const totalUsers = await prisma.user.count();
  const usersWithCampus = await prisma.user.count({
    where: {
      college: {
        not: null
      }
    }
  });

  console.log(`\n📊 User Campus Stats:`);
  console.log(`Total users: ${totalUsers}`);
  console.log(`Users with campus: ${usersWithCampus}`);
  console.log(`Users without campus: ${totalUsers - usersWithCampus}`);

  // Check doorcard campus distribution for recent terms
  const recentDoorcards = await prisma.doorcard.findMany({
    where: {
      OR: [
        { term: 'FALL', year: 2024 },
        { term: 'SPRING', year: 2025 },
        { term: 'SUMMER', year: 2025 }
      ]
    }
  });

  const campusCount = {
    SKYLINE: 0,
    CSM: 0,
    CANADA: 0
  };

  recentDoorcards.forEach(doorcard => {
    campusCount[doorcard.college]++;
  });

  console.log(`\n🏫 Recent Doorcard Campus Distribution:`);
  console.log(`SKYLINE: ${campusCount.SKYLINE}`);
  console.log(`CSM: ${campusCount.CSM}`);
  console.log(`CANADA: ${campusCount.CANADA}`);
  console.log(`Total: ${recentDoorcards.length}`);
}

sampleDataCheck()
  .catch((error) => {
    console.error('❌ Error:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });