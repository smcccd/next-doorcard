import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getImportStatus() {
  try {
    const [userCount, doorcardCount, appointmentCount] = await Promise.all([
      prisma.user.count(),
      prisma.doorcard.count(), 
      prisma.appointment.count()
    ]);

    const timestamp = new Date().toLocaleTimeString();
    
    console.clear();
    console.log(`🔍 IMPORT MONITOR - ${timestamp}`);
    console.log(`${'='.repeat(50)}`);
    console.log(`👥 Users:        ${userCount.toLocaleString()}`);
    console.log(`🃏 Doorcards:    ${doorcardCount.toLocaleString()}`);
    console.log(`📅 Appointments: ${appointmentCount.toLocaleString()}`);
    console.log(`${'='.repeat(50)}`);
    console.log(`📊 Total Records: ${(userCount + doorcardCount + appointmentCount).toLocaleString()}`);
    console.log(`\n⏰ Last updated: ${timestamp}`);
    console.log(`⏭️  Next update in 5 seconds...`);
    
  } catch (error) {
    console.error("❌ Error fetching status:", error);
  }
}

async function startMonitoring() {
  console.log("🚀 Starting import monitoring...");
  console.log("💡 Run this in a separate terminal while import is running");
  console.log("🛑 Press Ctrl+C to stop monitoring\n");

  // Initial status
  await getImportStatus();
  
  // Update every 5 seconds
  const interval = setInterval(async () => {
    await getImportStatus();
  }, 5000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping monitor...');
    clearInterval(interval);
    prisma.$disconnect();
    process.exit(0);
  });
}

if (require.main === module) {
  startMonitoring();
}