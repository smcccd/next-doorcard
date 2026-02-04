const { PrismaClient } = require("@prisma/client");
require("dotenv").config();
const prisma = new PrismaClient();

async function checkUser() {
  try {
    console.log("🔍 Checking production database for user besnyib...");

    // Check if user exists
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
      console.log("✅ User found:");
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
      console.log("❌ User besnyib not found in production database");

      // Check if there are any users
      const userCount = await prisma.user.count();
      console.log(`   Total users in database: ${userCount}`);

      if (userCount > 0) {
        const sampleUsers = await prisma.user.findMany({
          take: 3,
          select: { username: true, email: true, name: true },
        });
        console.log("   Sample users:");
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

checkUser();
