const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkLocalDB() {
  try {
    console.log("🔍 Checking LOCAL SQLite database...");

    // Check if user exists locally
    const user = await prisma.user.findUnique({
      where: { username: "besnyib" },
      include: {
        Doorcard: {
          include: {
            Appointment: true,
          },
        },
      },
    });

    if (user) {
      console.log("✅ User found in LOCAL database:");
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Doorcards: ${user.Doorcard.length}`);

      user.Doorcard.forEach((doorcard, index) => {
        console.log(`   
   Doorcard ${index + 1}:
     ID: ${doorcard.id}
     Name: ${doorcard.name}
     Slug: ${doorcard.slug}
     Active: ${doorcard.isActive}
     Public: ${doorcard.isPublic}
     Term: ${doorcard.term} ${doorcard.year}
     Appointments: ${doorcard.Appointment.length}`);
      });
    } else {
      console.log("❌ User besnyib not found in LOCAL database");

      // Check total users in local database
      const userCount = await prisma.user.count();
      console.log(`   Total users in LOCAL database: ${userCount}`);

      if (userCount > 0) {
        const sampleUsers = await prisma.user.findMany({
          take: 3,
          select: { username: true, email: true, name: true },
        });
        console.log("   Sample users in LOCAL database:");
        sampleUsers.forEach((u) =>
          console.log(`     - ${u.username} (${u.email})`)
        );
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkLocalDB();
