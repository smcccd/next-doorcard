import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.doorcard.update({
    where: { id: "62b1e928-27e7-44ed-9543-fd4101450ac5" },
    data: { isPublic: true },
  });

  console.log("✅ Doorcard updated to be public:", updated.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
