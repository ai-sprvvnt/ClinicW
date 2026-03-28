const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.clinicSettings.findUnique({ where: { id: 1 } });
  console.log(settings);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
