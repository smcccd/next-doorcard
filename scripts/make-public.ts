import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.doorcard.update({
    where: { id: "off-hours-test-doorcard" },
    data: { isPublic: true },
  });

  console.log("✅ Doorcard updated to be public:", updated.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
