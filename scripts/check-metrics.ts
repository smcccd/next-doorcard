import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMetrics() {
  console.log('🔍 Checking Metrics Data');
  console.log('='.repeat(30));

  // Check if there are any metrics at all
  const totalMetrics = await prisma.doorcardMetrics.count();
  console.log(`Total doorcard metrics records: ${totalMetrics}`);

  // Check sample metrics
  const sampleMetrics = await prisma.doorcardMetrics.findMany({
    take: 5,
    include: {
      doorcard: {
        select: {
          name: true,
          term: true,
          year: true,
          college: true
        }
      }
    }
  });

  console.log('\nSample metrics:');
  sampleMetrics.forEach((metric, index) => {
    console.log(`${index + 1}. ${metric.doorcard.name} (${metric.doorcard.term} ${metric.doorcard.year}, ${metric.doorcard.college})`);
    console.log(`   Views: ${metric.totalViews}, Prints: ${metric.totalPrints}, Shares: ${metric.totalShares}`);
    console.log(`   Last viewed: ${metric.lastViewedAt || 'Never'}`);
  });

  // Check analytics events
  const totalAnalytics = await prisma.doorcardAnalytics.count();
  console.log(`\nTotal analytics events: ${totalAnalytics}`);

  // Check recent analytics
  const recentAnalytics = await prisma.doorcardAnalytics.findMany({
    take: 10,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      doorcard: {
        select: {
          name: true,
          term: true,
          year: true,
          college: true
        }
      }
    }
  });

  console.log('\nRecent analytics events:');
  recentAnalytics.forEach((event, index) => {
    console.log(`${index + 1}. ${event.eventType} - ${event.doorcard.name} (${event.doorcard.college}) - ${event.createdAt.toISOString().split('T')[0]}`);
  });

  // Check for recent term doorcards with metrics
  const recentDoorcards = await prisma.doorcard.findMany({
    where: {
      OR: [
        { term: 'FALL', year: 2024 },
        { term: 'SPRING', year: 2025 },
        { term: 'SUMMER', year: 2025 }
      ]
    },
    include: {
      metrics: true
    }
  });

  const doorcarsWithMetrics = recentDoorcards.filter(d => d.metrics !== null);
  console.log(`\nRecent doorcards: ${recentDoorcards.length}`);
  console.log(`Recent doorcards with metrics: ${doorcarsWithMetrics.length}`);

  if (doorcarsWithMetrics.length > 0) {
    console.log('\nSample recent doorcards with metrics:');
    doorcarsWithMetrics.slice(0, 5).forEach((doorcard, index) => {
      console.log(`${index + 1}. ${doorcard.name} (${doorcard.college})`);
      console.log(`   Views: ${doorcard.metrics?.totalViews}, Prints: ${doorcard.metrics?.totalPrints}, Shares: ${doorcard.metrics?.totalShares}`);
    });
  }
}

checkMetrics()
  .catch((error) => {
    console.error('❌ Error:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });