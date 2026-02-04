const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function searchMiller() {
  console.log("=== Searching for Miller-related data ===\n");

  // Search for users
  console.log('1. USERS with "miller" in username or name:');
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: "miller" } },
        { name: { contains: "Miller" } },
        { name: { contains: "miller" } },
      ],
    },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  console.log(`Found ${users.length} users:`);
  users.forEach((user) => {
    console.log(
      `  - Username: ${user.username}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`
    );
    console.log(`    ID: ${user.id}, Created: ${user.createdAt}`);
  });

  // Search for doorcards
  console.log("\n2. DOORCARDS for miller users:");
  const doorcards = await prisma.doorcard.findMany({
    where: {
      User: {
        OR: [
          { username: { contains: "miller" } },
          { name: { contains: "Miller" } },
        ],
      },
    },
    include: {
      User: {
        select: {
          username: true,
          name: true,
        },
      },
      Appointment: {
        select: {
          name: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          location: true,
          category: true,
        },
      },
    },
  });

  console.log(`Found ${doorcards.length} doorcards:`);
  doorcards.forEach((dc) => {
    console.log(`\n  Doorcard: ${dc.doorcardName || dc.name}`);
    console.log(`  - User: ${dc.User.username} (${dc.User.name})`);
    console.log(`  - Term: ${dc.term} ${dc.year}, College: ${dc.college}`);
    console.log(`  - Office: ${dc.officeNumber || "Not specified"}`);
    console.log(`  - Active: ${dc.isActive}, Public: ${dc.isPublic}`);
    console.log(`  - Appointments: ${dc.Appointment.length}`);

    if (dc.Appointment.length > 0) {
      console.log("    Appointments:");
      dc.Appointment.forEach((apt) => {
        console.log(
          `      * ${apt.name} - ${apt.dayOfWeek} ${apt.startTime}-${apt.endTime} at ${apt.location}`
        );
        console.log(`        Category: ${apt.category}`);
      });
    }
  });

  // Specific search for Judith Miller
  console.log('\n3. SPECIFIC SEARCH for "Judith Miller":');
  const judithUsers = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: "Judith Miller" } },
        {
          AND: [{ username: "millerj" }, { name: { contains: "Judith" } }],
        },
      ],
    },
  });

  if (judithUsers.length > 0) {
    console.log("Found Judith Miller users:");
    judithUsers.forEach((user) => {
      console.log(`  - ${user.username}: ${user.name} (${user.email})`);
    });
  } else {
    console.log('No users found with name "Judith Miller"');
  }

  // Check for millerj specifically
  console.log('\n4. SPECIFIC USER "millerj":');
  const millerj = await prisma.user.findUnique({
    where: { username: "millerj" },
    include: {
      doorcards: {
        include: {
          Appointment: true,
        },
      },
    },
  });

  if (millerj) {
    console.log(`Found user millerj:`);
    console.log(`  - Name: ${millerj.name}`);
    console.log(`  - Email: ${millerj.email}`);
    console.log(`  - Role: ${millerj.role}`);
    console.log(`  - Doorcards: ${millerj.doorcards.length}`);

    millerj.doorcards.forEach((dc) => {
      console.log(`\n    Doorcard: ${dc.doorcardName || dc.name}`);
      console.log(`      Term: ${dc.term} ${dc.year}`);
      console.log(`      Appointments: ${dc.Appointment.length}`);
    });
  } else {
    console.log('User "millerj" not found in database');
  }
}

searchMiller()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
